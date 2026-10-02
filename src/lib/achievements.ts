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
  /** Colores de la reliquia (orbe) en pixel art. */
  color: string
  dark: string
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
    color: '#d8283f',
    dark: '#4a0a15',
    check: (ctx) => totalCompletions(ctx) >= 1,
  },
  {
    id: 'streak-7',
    name: 'Pacto de una Semana',
    description: 'Alcanza una racha de 7 días',
    bonusCoins: 15,
    color: '#4a63d8',
    dark: '#141c52',
    check: (ctx) => maxStreak(ctx) >= 7,
  },
  {
    id: 'streak-30',
    name: 'Guardián Eterno',
    description: 'Alcanza una racha de 30 días',
    bonusCoins: 50,
    color: '#9b59d0',
    dark: '#3c1a5c',
    check: (ctx) => maxStreak(ctx) >= 30,
  },
  {
    id: 'level-5',
    name: 'Cazador Veterano',
    description: 'Alcanza el nivel 5',
    bonusCoins: 20,
    color: '#3fae6a',
    dark: '#0f3a20',
    check: (ctx) => ctx.profile.level >= 5,
  },
  {
    id: 'level-10',
    name: 'Señor de la Noche',
    description: 'Alcanza el nivel 10',
    bonusCoins: 40,
    color: '#e2c275',
    dark: '#5e4712',
    check: (ctx) => ctx.profile.level >= 10,
  },
  {
    id: 'century',
    name: 'Centuria',
    description: 'Completa 100 tareas en total',
    bonusCoins: 60,
    color: '#d6dcea',
    dark: '#3b4058',
    check: (ctx) => totalCompletions(ctx) >= 100,
  },
]
