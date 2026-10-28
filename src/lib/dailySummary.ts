import { addDays, format, parseISO } from 'date-fns'
import type { Completion, DaySnapshot, Item, ItemEvent, PlayerProfile, RouteId } from '../types'
import { activityDateKey } from './date'
import { belongsToRun, penaltyDate, yesterdayKey } from './dayCorrections'
import { HP_PER_LEVEL, rewindXp, xpToNextLevel } from './gamification'
import { isCompletedOn } from './recurrence'
import { linkedRouteItems, recomputeRoute, ROUTE_IDS, ROUTES, routeStatus } from './routes'
import { streakEndingOn } from './streak'

export interface SummaryDone {
  id: string
  title: string
  xp: number
  coins: number
  quantityDone?: number
  unit?: string
}

export interface SummaryMiss {
  id: string
  title: string
  damage: number
  protectedBy?: 'shield' | 'freeze'
}

export interface SummaryStreak {
  id: string
  title: string
  streak: number
}

export interface SummaryRoute {
  id: RouteId
  name: string
  icon: string
  levelBefore: number
  levelAfter: number
  levelUp: boolean
  maxed: boolean
  /** Nombre de la pasiva; solo existe cuando ya está desbloqueada, para no revelar la recompensa antes. */
  passiveName?: string
  /** Actividades distintas de la ruta cumplidas ese día. */
  activities: number
  minPerDay: number
  goodDay: boolean
  goodDays: number
  requiredGoodDays: number
}

export interface SummaryVitals {
  levelBefore: number
  levelAfter: number
  xpBefore: number
  xpAfter: number
  hp: number
  maxHp: number
  levelsGained: number
  maxHpGain: number
}

export interface DailySummary {
  date: string
  done: SummaryDone[]
  missed: SummaryMiss[]
  xpGained: number
  coinsGained: number
  damage: number
  protectedCount: number
  /** Nivel, EXP y vida al cierre; ausente si ese día no tiene snapshot (no se inventan). */
  vitals: SummaryVitals | null
  streaks: SummaryStreak[]
  routes: SummaryRoute[]
  /** Hay algo que contar: actividades, fallos o hitos. Los días vacíos no se abren solos. */
  hasContent: boolean
}

export interface SummaryInput {
  date: string
  profile: PlayerProfile
  items: Item[]
  completionsByItem: Record<string, Completion[]>
  events: ItemEvent[]
  snapshot?: DaySnapshot
}

const MAX_STREAKS = 3

/** Día del que se resume: siempre ayer según el corte de las 02:00. */
export function summaryDateKey(): string {
  return yesterdayKey()
}

function buildRoutes(input: SummaryInput): SummaryRoute[] {
  const { date, profile, items, completionsByItem } = input
  const dayBefore = format(addDays(parseISO(date), -1), 'yyyy-MM-dd')
  const routes: SummaryRoute[] = []
  for (const id of ROUTE_IDS) {
    const progress = profile.routes?.[id]
    if (!progress?.windowStart) continue
    const after = recomputeRoute(id, progress, items, completionsByItem, date)
    const before = recomputeRoute(id, progress, items, completionsByItem, dayBefore)
    const { linked } = linkedRouteItems(id, progress, items)
    const status = routeStatus(ROUTES[id], before, linked, completionsByItem, date)
    const levelUp = after.level > before.level
    routes.push({
      id,
      name: ROUTES[id].name,
      icon: ROUTES[id].icon,
      levelBefore: before.level,
      levelAfter: after.level,
      levelUp,
      maxed: status.maxed,
      passiveName: after.level > 0 ? ROUTES[id].passiveName : undefined,
      activities: status.doneToday,
      minPerDay: status.rule.minPerDay,
      goodDay: status.doneToday >= status.rule.minPerDay,
      goodDays: levelUp ? status.rule.goodDays : status.goodDays,
      requiredGoodDays: status.rule.goodDays,
    })
  }
  return routes
}

/**
 * Resumen puro de un día cerrado. Solo lee: no concede ni retira EXP, oro, vida, niveles ni rutas.
 * Devuelve null si el día no pertenece a la expedición actual o el personaje ha caído.
 */
export function buildDailySummary(input: SummaryInput): DailySummary | null {
  const { date, profile, items, completionsByItem, events, snapshot } = input
  const runStartedAt = profile.runStartedAt
  if (profile.dead) return null
  if (runStartedAt && date < activityDateKey(runStartedAt)) return null

  const done: SummaryDone[] = []
  for (const item of items) {
    const completion = (completionsByItem[item.id] ?? []).find((candidate) => candidate.date === date
      && (!runStartedAt || new Date(candidate.createdAt) >= new Date(runStartedAt)))
    if (!completion || !isCompletedOn(item, [completion], date)) continue
    done.push({
      id: item.id,
      title: item.title,
      xp: completion.xpEarned,
      coins: completion.coinsEarned,
      quantityDone: item.trackingType === 'quantity' ? completion.quantityDone : undefined,
      unit: item.unit,
    })
  }

  // Un fallo sin daño ni protección es el marcador de una recuperación tardía, no un fallo de ese día.
  const missed: SummaryMiss[] = events
    .filter((event) => event.kind === 'missed'
      && ((event.damage ?? 0) > 0 || event.protectedBy)
      && belongsToRun(event, runStartedAt)
      && penaltyDate(event, items) === date)
    .map((event) => ({
      id: event.id,
      title: event.itemTitle,
      damage: event.damage ?? 0,
      protectedBy: event.protectedBy,
    }))

  const xpGained = done.reduce((sum, entry) => sum + entry.xp, 0)
  const damage = missed.reduce((sum, miss) => sum + miss.damage, 0)

  let vitals: SummaryVitals | null = null
  if (snapshot?.date === date && snapshot.runStartedAt === runStartedAt) {
    const start = rewindXp(snapshot.level, snapshot.xp, xpGained)
    const levelsGained = snapshot.level - start.level
    vitals = {
      levelBefore: start.level,
      levelAfter: snapshot.level,
      xpBefore: start.xp,
      xpAfter: snapshot.xp,
      hp: snapshot.hp,
      maxHp: snapshot.maxHp,
      levelsGained,
      maxHpGain: levelsGained * HP_PER_LEVEL,
    }
  }

  const streaks: SummaryStreak[] = []
  for (const item of items) {
    if (item.archived || item.type === 'todo') continue
    const history = completionsByItem[item.id] ?? []
    if (!done.some((entry) => entry.id === item.id)) continue
    const streak = streakEndingOn(item, history, date)
    if (streak >= 2) streaks.push({ id: item.id, title: item.title, streak })
  }
  streaks.sort((a, b) => b.streak - a.streak)

  const routes = buildRoutes(input)

  return {
    date,
    done,
    missed,
    xpGained,
    coinsGained: done.reduce((sum, entry) => sum + entry.coins, 0),
    damage,
    protectedCount: missed.filter((miss) => miss.protectedBy).length,
    vitals,
    streaks: streaks.slice(0, MAX_STREAKS),
    routes,
    hasContent: done.length > 0 || missed.length > 0 || Boolean(vitals?.levelsGained)
      || routes.some((route) => route.levelUp),
  }
}

export function xpProgress(level: number, xp: number): number {
  return Math.min(100, (xp / xpToNextLevel(level)) * 100)
}
