import { computeStreak } from './streak'
import type { Completion, Item, PlayerProfile } from '../types'

export interface AchievementContext {
  items: Item[]
  completionsByItem: Record<string, Completion[]>
  profile: PlayerProfile
}

export interface AchievementDef {
  id: string
  name: string
  description: string
  bonusCoins: number
  check: (ctx: AchievementContext) => boolean
}

function totalCompletions(ctx: AchievementContext): number {
  return Object.values(ctx.completionsByItem).reduce(
    (sum, list) => sum + list.length,
    0,
  )
}

function maxStreak(ctx: AchievementContext): number {
  let max = 0
  for (const item of ctx.items) {
    if (item.type === 'todo') continue
    const streak = computeStreak(item, ctx.completionsByItem[item.id] ?? [])
    if (streak > max) max = streak
  }
  return max
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-blood',
    name: 'Primera Sangre',
    description: 'Completa tu primera tarea',
    bonusCoins: 5,
    check: (ctx) => totalCompletions(ctx) >= 1,
  },
  {
    id: 'streak-7',
    name: 'Pacto de una Semana',
    description: 'Alcanza una racha de 7 días',
    bonusCoins: 15,
    check: (ctx) => maxStreak(ctx) >= 7,
  },
  {
    id: 'streak-30',
    name: 'Guardián Eterno',
    description: 'Alcanza una racha de 30 días',
    bonusCoins: 50,
    check: (ctx) => maxStreak(ctx) >= 30,
  },
  {
    id: 'level-5',
    name: 'Cazador Veterano',
    description: 'Alcanza el nivel 5',
    bonusCoins: 20,
    check: (ctx) => ctx.profile.level >= 5,
  },
  {
    id: 'level-10',
    name: 'Señor de la Noche',
    description: 'Alcanza el nivel 10',
    bonusCoins: 40,
    check: (ctx) => ctx.profile.level >= 10,
  },
  {
    id: 'century',
    name: 'Centuria',
    description: 'Completa 100 tareas en total',
    bonusCoins: 60,
    check: (ctx) => totalCompletions(ctx) >= 100,
  },
]
