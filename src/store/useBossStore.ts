import { create } from 'zustand'
import { db } from '../db/database'
import { todayKey } from '../lib/date'
import { activeEncounter, planBossSync } from '../lib/bosses'
import { modifyCoins, modifyXp, type ModifierContext } from '../lib/modifiers'
import { reconcileSoulPassiveActivations } from '../lib/soulPassiveLedger'
import type { BossEncounter, Completion, DeathStakePercent, Item, ItemEvent } from '../types'
import { mergeLevelUp, usePlayerStore } from './usePlayerStore'

interface BossState {
  encounters: BossEncounter[]
  events: ItemEvent[]
  loaded: boolean
  /** Avanza el ciclo del boss hasta hoy y aplica, una sola vez, recompensa o daño. */
  sync: () => Promise<void>
}

async function runSync(): Promise<void> {
  const before = usePlayerStore.getState().profile
  const result = await db.transaction(
    'rw',
    [
      db.profile, db.items, db.completions, db.bossEncounters, db.daySnapshots,
      db.itemEvents, db.soulPassiveActivations,
    ],
    async () => {
      const profile = await db.profile.get(1)
      if (!profile) return null
      const [items, completions, encounters, daySnapshots, events, soulPassiveActivations] = await Promise.all([
        db.items.toArray(),
        db.completions.toArray(),
        db.bossEncounters.toArray(),
        db.daySnapshots.toArray(),
        db.itemEvents.toArray(),
        db.soulPassiveActivations.toArray(),
      ])
      const completionsByItem: Record<string, Completion[]> = {}
      for (const completion of completions) (completionsByItem[completion.itemId] ??= []).push(completion)
      const plan = planBossSync({
        today: todayKey(),
        profile,
        items,
        completionsByItem,
        encounters,
        events,
        daySnapshots,
        soulPassiveActivations,
      })
      if (plan.changed.length > 0) await db.bossEncounters.bulkPut(plan.changed)
      if (plan.dailyPassiveActivations.length > 0) {
        await db.soulPassiveActivations.bulkPut(plan.dailyPassiveActivations)
      }
      if (profile.runStartedAt) {
        await reconcileSoulPassiveActivations(
          profile.runStartedAt,
          plan.passiveActivationSources,
          plan.passiveActivations,
        )
      }
      const profileChanged = plan.profile !== profile
      if (profileChanged) await db.profile.put(plan.profile)
      return { plan, profileChanged, events }
    },
  )
  if (!result) return

  const { plan, profileChanged, events } = result
  useBossStore.setState({ encounters: plan.encounters, events, loaded: true })
  if (profileChanged) {
    await usePlayerStore.getState().load()
    const after = usePlayerStore.getState().profile
    if (plan.leveledUp && before && after) {
      usePlayerStore.setState({ justLeveledUp: mergeLevelUp(usePlayerStore.getState().justLeveledUp, before, after) })
    }
  }
}

// Las sincronizaciones se encadenan para que dos disparos seguidos no compitan por la misma escritura.
let queue: Promise<void> = Promise.resolve()

export const useBossStore = create<BossState>(() => ({
  encounters: [],
  events: [],
  loaded: false,
  sync: () => {
    const next = queue.then(runSync, runSync)
    queue = next.catch(() => undefined)
    return next
  },
}))

/** Boss activo ahora mismo, o null. */
export function currentActiveBoss(): BossEncounter | null {
  return activeEncounter(useBossStore.getState().encounters)
}

/** Boss y maldiciones que alteran las reglas ahora mismo. */
export function currentModifiers(item?: Pick<Item, 'zone' | 'difficulty'>): ModifierContext {
  const profile = usePlayerStore.getState().profile
  return {
    boss: currentActiveBoss(),
    curses: profile?.curses,
    zone: item?.zone,
    soulProfile: profile ?? undefined,
    soulDate: todayKey(),
    itemDifficulty: item?.difficulty,
  }
}

/** Aplica los efectos del boss y las maldiciones a una cantidad de EXP ya calculada con los bonos normales. */
export function xpAfterModifiers(
  xp: number,
  dateKey = todayKey(),
  item?: Pick<Item, 'zone' | 'difficulty'>,
  soulFirstZone = false,
): number {
  return modifyXp(xp, { ...currentModifiers(item), soulFirstZone }, dateKey)
}

export function coinsAfterModifiers(
  coins: number,
  dateKey = todayKey(),
  item?: Pick<Item, 'zone' | 'difficulty'>,
): number {
  return modifyCoins(coins, currentModifiers(item), dateKey)
}

/** Fija la apuesta de Death y retira el oro de forma atómica. */
export async function chooseDeathStake(percent: DeathStakePercent): Promise<boolean> {
  let selected: BossEncounter | undefined
  await db.transaction('rw', [db.profile, db.bossEncounters], async () => {
    const profile = await db.profile.get(1)
    const encounters = await db.bossEncounters.toArray()
    const active = activeEncounter(encounters)
    if (!profile || !active || active.bossId !== 'death' || active.stakePercent !== undefined) return
    const stakeCoins = Math.floor((profile.coins * percent) / 100)
    selected = { ...active, stakePercent: percent, stakeCoins }
    await db.profile.put({ ...profile, coins: profile.coins - stakeCoins })
    await db.bossEncounters.put(selected)
  })
  if (!selected) return false
  useBossStore.setState((state) => ({
    encounters: state.encounters.map((encounter) => encounter.id === selected?.id ? selected : encounter),
  }))
  await usePlayerStore.getState().load()
  return true
}

// Una expedición nueva borra los encuentros pendientes: se vuelve a programar de inmediato.
usePlayerStore.subscribe((state, previous) => {
  const next = state.profile?.runStartedAt
  if (previous.profile && next && previous.profile.runStartedAt !== next) {
    void useBossStore.getState().sync().catch(() => undefined)
  }
})
