import { v4 as uuid } from 'uuid'
import { create } from 'zustand'
import { db } from '../db/database'
import { shopPrice } from '../lib/routes'
import { usePlayerStore } from './usePlayerStore'
import type { Reward } from '../types'

interface RewardsState {
  rewards: Reward[]
  loading: boolean
  load: () => Promise<void>
  addReward: (name: string, cost: number) => Promise<void>
  redeem: (rewardId: string) => Promise<boolean>
  removeReward: (rewardId: string) => Promise<void>
}

export const useRewardsStore = create<RewardsState>((set, get) => ({
  rewards: [],
  loading: true,

  load: async () => {
    const rewards = await db.rewards.toArray()
    set({ rewards, loading: false })
  },

  addReward: async (name, cost) => {
    const reward: Reward = {
      id: uuid(),
      name,
      cost,
      createdAt: new Date().toISOString(),
    }
    await db.rewards.add(reward)
    set({ rewards: [...get().rewards, reward] })
  },

  redeem: async (rewardId) => {
    const reward = get().rewards.find((r) => r.id === rewardId)
    if (!reward) return false
    return usePlayerStore.getState().spendCoins(shopPrice(reward.cost, usePlayerStore.getState().profile))
  },

  removeReward: async (rewardId) => {
    await db.rewards.delete(rewardId)
    set({ rewards: get().rewards.filter((r) => r.id !== rewardId) })
  },
}))
