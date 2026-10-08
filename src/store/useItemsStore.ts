import { v4 as uuid } from 'uuid'
import { addDays, format } from 'date-fns'
import { create } from 'zustand'
import { db } from '../db/database'
import { todayKey } from '../lib/date'
import { DIFFICULTY_COINS, DIFFICULTY_XP } from '../lib/gamification'
import { itemEventId, recordItemEvent } from '../lib/itemEvents'
import { isItemDueOn, isObligation, scheduledDateFor } from '../lib/recurrence'
import { xpWithBonus } from '../lib/routes'
import { useAchievementsStore } from './useAchievementsStore'
import { usePlayerStore } from './usePlayerStore'
import type {
  Completion,
  Difficulty,
  Item,
  ItemCommitment,
  ItemType,
  RouteId,
  TrackingType,
} from '../types'

export interface NewItemInput {
  type: ItemType
  commitment?: ItemCommitment
  title: string
  icon?: string
  zone?: string
  difficulty: Difficulty
  recurrenceRule?: string | null
  startDate?: string
  routeId?: RouteId
  trackingType: TrackingType
  quantityGoal?: number
  unit?: string
  dueDate?: string | null
}

interface ItemsState {
  items: Item[]
  /** Completions de hoy, indexadas por itemId. */
  completionsToday: Record<string, Completion>
  /** Historial completo de completions, indexado por itemId (para rachas/score). */
  completionsByItem: Record<string, Completion[]>
  loading: boolean
  load: () => Promise<void>
  addItem: (input: NewItemInput) => Promise<void>
  archiveItem: (itemId: string) => Promise<void>
  toggleBoolean: (itemId: string) => Promise<void>
  adjustQuantity: (itemId: string, delta: number) => Promise<void>
  postponeItem: (itemId: string) => Promise<boolean>
}

async function refreshItemHistory(itemId: string) {
  return db.completions.where('itemId').equals(itemId).toArray()
}

async function clearPostponement(itemId: string) {
  await db.items.update(itemId, { postponedFrom: undefined, postponedUntil: undefined })
  setItemsWithoutChangingHistory(itemId)
}

function setItemsWithoutChangingHistory(itemId: string) {
  const state = useItemsStore.getState()
  useItemsStore.setState({
    items: state.items.map((candidate) =>
      candidate.id === itemId
        ? { ...candidate, postponedFrom: undefined, postponedUntil: undefined }
        : candidate,
    ),
  })
}

async function checkAchievements(
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
) {
  const profile = usePlayerStore.getState().profile
  if (!profile) return
  await useAchievementsStore.getState().checkAndUnlock({ items, completionsByItem, profile })
}

export const useItemsStore = create<ItemsState>((set, get) => ({
  items: [],
  completionsToday: {},
  completionsByItem: {},
  loading: true,

  load: async () => {
    const [items, allCompletions] = await Promise.all([
      db.items.toArray(),
      db.completions.toArray(),
    ])
    const today = todayKey()
    const completionsToday: Record<string, Completion> = {}
    const completionsByItem: Record<string, Completion[]> = {}
    for (const completion of allCompletions) {
      if (completion.date === today) completionsToday[completion.itemId] = completion
      if (!completionsByItem[completion.itemId]) completionsByItem[completion.itemId] = []
      completionsByItem[completion.itemId].push(completion)
    }
    set({ items, completionsToday, completionsByItem, loading: false })
  },

  addItem: async (input) => {
    const item: Item = {
      id: uuid(),
      archived: false,
      createdAt: new Date().toISOString(),
      ...input,
    }
    await db.items.add(item)
    set({ items: [...get().items, item] })
  },

  archiveItem: async (itemId) => {
    await db.items.update(itemId, { archived: true })
    set({
      items: get().items.map((item) =>
        item.id === itemId ? { ...item, archived: true } : item,
      ),
    })
  },

  toggleBoolean: async (itemId) => {
    const item = get().items.find((i) => i.id === itemId)
    if (item?.trackingType !== 'boolean') return

    const existing = get().completionsToday[itemId]
    if (existing) {
      await db.completions.delete(existing.id)
      await recordItemEvent(item, 'undone', existing.date, {
        xpEarned: existing.xpEarned,
        coinsEarned: existing.coinsEarned,
      })
      await usePlayerStore
        .getState()
        .revertCompletion(existing.xpEarned, existing.coinsEarned)
      const next = { ...get().completionsToday }
      delete next[itemId]
      set({
        completionsToday: next,
        completionsByItem: {
          ...get().completionsByItem,
          [itemId]: await refreshItemHistory(itemId),
        },
      })
      return
    }

    const xp = xpWithBonus(DIFFICULTY_XP[item.difficulty], usePlayerStore.getState().profile)
    const coins = DIFFICULTY_COINS[item.difficulty]
    const today = todayKey()
    const scheduledDate = scheduledDateFor(item, new Date())
    let effectiveDueDate = today
    if (item.type === 'todo' && item.dueDate && item.postponedUntil !== today) {
      effectiveDueDate = item.dueDate
    }
    const late = effectiveDueDate < today
    const completion: Completion = {
      id: uuid(),
      itemId,
      date: today,
      xpEarned: xp,
      coinsEarned: coins,
      createdAt: new Date().toISOString(),
    }
    await db.completions.add(completion)
    if (late) {
      await recordItemEvent(
        item,
        'missed',
        scheduledDate,
        { damage: 0 },
        itemEventId(item.id, scheduledDate, 'missed'),
      )
    }
    const completionKind = late ? 'lateRecovery' : 'completed'
    await recordItemEvent(
      item,
      completionKind,
      scheduledDate,
      { xpEarned: xp, coinsEarned: coins },
      itemEventId(item.id, scheduledDate, completionKind),
    )
    if (item.postponedUntil === today) await clearPostponement(item.id)
    await usePlayerStore.getState().awardCompletion(xp, coins)
    const completionsByItem = {
      ...get().completionsByItem,
      [itemId]: await refreshItemHistory(itemId),
    }
    set({
      completionsToday: { ...get().completionsToday, [itemId]: completion },
      completionsByItem,
    })
    await usePlayerStore.getState().evaluateRoutes(get().items, completionsByItem)
    await checkAchievements(get().items, completionsByItem)
  },

  adjustQuantity: async (itemId, delta) => {
    const item = get().items.find((i) => i.id === itemId)
    if (item?.trackingType !== 'quantity' || !item.quantityGoal) return

    const goal = item.quantityGoal
    const existing = get().completionsToday[itemId]
    const prevQty = existing?.quantityDone ?? 0
    const nextQty = Math.min(Math.max(prevQty + delta, 0), goal)
    if (nextQty === prevQty) return

    const wasComplete = prevQty >= goal
    const isComplete = nextQty >= goal
    const xp = xpWithBonus(DIFFICULTY_XP[item.difficulty], usePlayerStore.getState().profile)
    const coins = DIFFICULTY_COINS[item.difficulty]

    if (!wasComplete && isComplete) {
      await usePlayerStore.getState().awardCompletion(xp, coins)
    } else if (wasComplete && !isComplete) {
      await usePlayerStore
        .getState()
        .revertCompletion(existing?.xpEarned ?? xp, existing?.coinsEarned ?? coins)
    }

    if (nextQty === 0) {
      await recordItemEvent(item, 'undone', todayKey(), { quantityDone: 0 })
      if (existing) {
        await db.completions.delete(existing.id)
        const next = { ...get().completionsToday }
        delete next[itemId]
        set({
          completionsToday: next,
          completionsByItem: {
            ...get().completionsByItem,
            [itemId]: await refreshItemHistory(itemId),
          },
        })
      }
      return
    }

    const completion: Completion = {
      id: existing?.id ?? uuid(),
      itemId,
      date: todayKey(),
      quantityDone: nextQty,
      xpEarned: isComplete ? xp : 0,
      coinsEarned: isComplete ? coins : 0,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    await db.completions.put(completion)
    await recordItemEvent(item, 'partialProgress', todayKey(), {
      quantityGoal: goal,
      quantityDone: nextQty,
    })
    if (!wasComplete && isComplete) {
      await recordItemEvent(
        item,
        'completed',
        todayKey(),
        {
          quantityGoal: goal,
          quantityDone: nextQty,
          xpEarned: xp,
          coinsEarned: coins,
        },
        itemEventId(item.id, todayKey(), 'completed'),
      )
    }
    const completionsByItem = {
      ...get().completionsByItem,
      [itemId]: await refreshItemHistory(itemId),
    }
    set({
      completionsToday: { ...get().completionsToday, [itemId]: completion },
      completionsByItem,
    })
    if (!wasComplete && isComplete) {
      await usePlayerStore.getState().evaluateRoutes(get().items, completionsByItem)
      await checkAchievements(get().items, completionsByItem)
    }
  },

  postponeItem: async (itemId) => {
    const item = get().items.find((candidate) => candidate.id === itemId)
    const today = todayKey()
    if (
      !item ||
      !isObligation(item) ||
      get().completionsToday[itemId] ||
      item.postponedUntil === today ||
      !isItemDueOn(item, new Date())
    ) return false

    const spent = await usePlayerStore.getState().spendPostponeToken()
    if (!spent) return false

    const postponedUntil = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    await db.items.update(itemId, { postponedFrom: today, postponedUntil })
    useItemsStore.setState({
      items: get().items.map((candidate) =>
        candidate.id === itemId
          ? { ...candidate, postponedFrom: today, postponedUntil }
          : candidate,
      ),
    })
    await recordItemEvent(item, 'postponed', today, { postponedUntil })
    return true
  },
}))
