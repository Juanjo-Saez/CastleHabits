import { create } from 'zustand'
import { db } from '../db/database'
import { ACHIEVEMENTS, type AchievementContext } from '../lib/achievements'
import { usePlayerStore } from './usePlayerStore'
import type { Achievement } from '../types'

interface AchievementsState {
  unlocked: Record<string, Achievement>
  loading: boolean
  load: () => Promise<void>
  checkAndUnlock: (ctx: AchievementContext) => Promise<void>
}

export const useAchievementsStore = create<AchievementsState>((set, get) => ({
  unlocked: {},
  loading: true,

  load: async () => {
    const records = await db.achievements.toArray()
    const unlocked: Record<string, Achievement> = {}
    for (const record of records) unlocked[record.id] = record
    set({ unlocked, loading: false })
  },

  checkAndUnlock: async (ctx) => {
    const current = get().unlocked
    let totalBonus = 0
    const newlyUnlocked: Achievement[] = []

    for (const def of ACHIEVEMENTS) {
      if (current[def.id]) continue
      if (def.check(ctx)) {
        newlyUnlocked.push({
          id: def.id,
          name: def.name,
          description: def.description,
          unlockedAt: new Date().toISOString(),
        })
        totalBonus += def.bonusCoins
      }
    }

    if (newlyUnlocked.length === 0) return

    await db.achievements.bulkPut(newlyUnlocked)
    const updated = { ...current }
    for (const achievement of newlyUnlocked) updated[achievement.id] = achievement
    set({ unlocked: updated })

    if (totalBonus > 0) {
      await usePlayerStore.getState().awardCompletion(0, totalBonus)
    }
  },
}))
