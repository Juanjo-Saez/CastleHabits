import { v4 as uuid } from 'uuid'
import { create } from 'zustand'
import { db } from '../db/database'
import { todayKey } from '../lib/date'
import { DIFFICULTY_COINS, DIFFICULTY_XP } from '../lib/gamification'
import { usePlayerStore } from './usePlayerStore'
import type {
  Completion,
  Difficulty,
  Item,
  ItemType,
  TrackingType,
} from '../types'

export interface NewItemInput {
  type: ItemType
  title: string
  icon?: string
  zone?: string
  difficulty: Difficulty
  recurrenceRule?: string | null
  trackingType: TrackingType
  quantityGoal?: number
  unit?: string
  dueDate?: string | null
}

interface ItemsState {
  items: Item[]
  /** Completions de hoy, indexadas por itemId. */
  completionsToday: Record<string, Completion>
  loading: boolean
  load: () => Promise<void>
  addItem: (input: NewItemInput) => Promise<void>
  archiveItem: (itemId: string) => Promise<void>
  toggleBoolean: (itemId: string) => Promise<void>
  adjustQuantity: (itemId: string, delta: number) => Promise<void>
}

export const useItemsStore = create<ItemsState>((set, get) => ({
  items: [],
  completionsToday: {},
  loading: true,

  load: async () => {
    const [items, completions] = await Promise.all([
      db.items.toArray(),
      db.completions.where('date').equals(todayKey()).toArray(),
    ])
    const completionsToday: Record<string, Completion> = {}
    for (const completion of completions) {
      completionsToday[completion.itemId] = completion
    }
    set({ items, completionsToday, loading: false })
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
      await usePlayerStore
        .getState()
        .revertCompletion(existing.xpEarned, existing.coinsEarned)
      const next = { ...get().completionsToday }
      delete next[itemId]
      set({ completionsToday: next })
      return
    }

    const xp = DIFFICULTY_XP[item.difficulty]
    const coins = DIFFICULTY_COINS[item.difficulty]
    const completion: Completion = {
      id: uuid(),
      itemId,
      date: todayKey(),
      xpEarned: xp,
      coinsEarned: coins,
      createdAt: new Date().toISOString(),
    }
    await db.completions.add(completion)
    await usePlayerStore.getState().awardCompletion(xp, coins)
    set({ completionsToday: { ...get().completionsToday, [itemId]: completion } })
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
    const xp = DIFFICULTY_XP[item.difficulty]
    const coins = DIFFICULTY_COINS[item.difficulty]

    if (!wasComplete && isComplete) {
      await usePlayerStore.getState().awardCompletion(xp, coins)
    } else if (wasComplete && !isComplete) {
      await usePlayerStore.getState().revertCompletion(xp, coins)
    }

    if (nextQty === 0) {
      if (existing) {
        await db.completions.delete(existing.id)
        const next = { ...get().completionsToday }
        delete next[itemId]
        set({ completionsToday: next })
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
    set({ completionsToday: { ...get().completionsToday, [itemId]: completion } })
  },
}))
