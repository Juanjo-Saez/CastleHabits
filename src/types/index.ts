export type ItemType = 'habit' | 'chore' | 'todo'

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard'

export type TrackingType = 'boolean' | 'quantity'

export interface Item {
  id: string
  type: ItemType
  title: string
  icon?: string
  /** Solo para chores: zona/estancia del castillo (ej. "Cocina"). */
  zone?: string
  difficulty: Difficulty
  /** Regla RRULE en texto. null/undefined para todos puntuales. */
  recurrenceRule?: string | null
  trackingType: TrackingType
  /** Meta a alcanzar cuando trackingType es "quantity" (ej. 100 sentadillas). */
  quantityGoal?: number
  unit?: string
  /** Solo para todos puntuales, ISO date. */
  dueDate?: string | null
  archived: boolean
  createdAt: string
}

export interface Completion {
  id: string
  itemId: string
  /** Día en formato yyyy-MM-dd, una entrada por item y día. */
  date: string
  quantityDone?: number
  xpEarned: number
  coinsEarned: number
  createdAt: string
}

export interface PlayerProfile {
  id: number
  level: number
  xp: number
  coins: number
  hp: number
  maxHp: number
  streakFreezes: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  unlockedAt?: string | null
}

export interface Reward {
  id: string
  name: string
  cost: number
  createdAt: string
}
