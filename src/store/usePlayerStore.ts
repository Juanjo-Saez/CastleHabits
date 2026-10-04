import { create } from 'zustand'
import { db, ensurePlayerProfile } from '../db/database'
import { todayKey } from '../lib/date'
import { xpToNextLevel } from '../lib/gamification'
import type { PlayerProfile } from '../types'

interface PlayerState {
  profile: PlayerProfile | null
  loading: boolean
  /** Nivel recién alcanzado, pendiente de celebrar en la UI (null = nada pendiente). */
  justLeveledUp: number | null
  clearLevelUp: () => void
  load: () => Promise<void>
  awardCompletion: (xp: number, coins: number) => Promise<void>
  revertCompletion: (xp: number, coins: number) => Promise<void>
  applyDamage: (amount: number) => Promise<void>
  restartRun: () => Promise<void>
  setLastPenaltyCheck: (date: string) => Promise<void>
  spendCoins: (amount: number) => Promise<boolean>
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  profile: null,
  loading: true,
  justLeveledUp: null,

  clearLevelUp: () => set({ justLeveledUp: null }),

  load: async () => {
    const profile = await ensurePlayerProfile()
    const normalized = {
      ...profile,
      hardcore: true,
      dead: Boolean(profile.dead),
    }
    if (normalized.hardcore !== profile.hardcore || normalized.dead !== profile.dead) {
      await db.profile.put(normalized)
    }
    set({ profile: normalized, loading: false })
  },

  awardCompletion: async (xp, coins) => {
    const current = get().profile
    if (!current || current.dead) return

    let { level, xp: currentXp, maxHp } = current
    currentXp += xp
    let leveledUp = false
    while (currentXp >= xpToNextLevel(level)) {
      currentXp -= xpToNextLevel(level)
      level += 1
      maxHp += 5
      leveledUp = true
    }

    const updated: PlayerProfile = {
      ...current,
      level,
      xp: currentXp,
      maxHp,
      hp: leveledUp ? maxHp : current.hp,
      coins: current.coins + coins,
    }
    await db.profile.put(updated)
    set({ profile: updated, justLeveledUp: leveledUp ? level : get().justLeveledUp })
  },

  // Simplificado: no revierte subidas de nivel, solo resta XP/monedas dentro del nivel actual.
  revertCompletion: async (xp, coins) => {
    const current = get().profile
    if (!current || current.dead) return

    const updated: PlayerProfile = {
      ...current,
      xp: Math.max(0, current.xp - xp),
      coins: Math.max(0, current.coins - coins),
    }
    await db.profile.put(updated)
    set({ profile: updated })
  },

  applyDamage: async (amount) => {
    const current = get().profile
    if (!current || current.dead || amount <= 0) return

    const nextHp = Math.max(0, current.hp - amount)
    const died = nextHp === 0

    const updated: PlayerProfile = {
      ...current,
      hp: nextHp,
      dead: died,
    }
    await db.profile.put(updated)
    set({ profile: updated })
  },

  restartRun: async () => {
    const current = get().profile
    if (!current) return

    const updated: PlayerProfile = {
      ...current,
      level: 1,
      xp: 0,
      coins: 0,
      hp: 50,
      maxHp: 50,
      streakFreezes: 0,
      dead: false,
      lastPenaltyCheck: todayKey(),
    }
    await db.profile.put(updated)
    set({ profile: updated, justLeveledUp: null })
  },

  setLastPenaltyCheck: async (date) => {
    const current = get().profile
    if (!current) return

    const updated: PlayerProfile = { ...current, lastPenaltyCheck: date }
    await db.profile.put(updated)
    set({ profile: updated })
  },

  spendCoins: async (amount) => {
    const current = get().profile
    if (!current || current.dead || current.coins < amount) return false

    const updated: PlayerProfile = { ...current, coins: current.coins - amount }
    await db.profile.put(updated)
    set({ profile: updated })
    return true
  },
}))
