import { create } from 'zustand'
import { db, ensurePlayerProfile } from '../db/database'
import { xpToNextLevel } from '../lib/gamification'
import type { PlayerProfile } from '../types'

interface PlayerState {
  profile: PlayerProfile | null
  loading: boolean
  load: () => Promise<void>
  awardCompletion: (xp: number, coins: number) => Promise<void>
  revertCompletion: (xp: number, coins: number) => Promise<void>
  applyDamage: (amount: number) => Promise<void>
  setLastPenaltyCheck: (date: string) => Promise<void>
  spendCoins: (amount: number) => Promise<boolean>
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  profile: null,
  loading: true,

  load: async () => {
    const profile = await ensurePlayerProfile()
    set({ profile, loading: false })
  },

  awardCompletion: async (xp, coins) => {
    const current = get().profile
    if (!current) return

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
    set({ profile: updated })
  },

  // Simplificado: no revierte subidas de nivel, solo resta XP/monedas dentro del nivel actual.
  revertCompletion: async (xp, coins) => {
    const current = get().profile
    if (!current) return

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
    if (!current || amount <= 0) return

    const updated: PlayerProfile = {
      ...current,
      hp: Math.max(0, current.hp - amount),
    }
    await db.profile.put(updated)
    set({ profile: updated })
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
    if (!current || current.coins < amount) return false

    const updated: PlayerProfile = { ...current, coins: current.coins - amount }
    await db.profile.put(updated)
    set({ profile: updated })
    return true
  },
}))
