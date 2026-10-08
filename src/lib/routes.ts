import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { isCompletedOn } from './recurrence'
import type {
  Completion,
  Difficulty,
  Item,
  PlayerProfile,
  RouteId,
  RouteProgress,
  TrackingType,
} from '../types'

export const MAX_ROUTE_LEVEL = 5
export const WINDOW_DAYS = 30
export const SHIELD_RECHARGE_DAYS = 15

export interface RouteActivityTemplate {
  title: string
  difficulty: Difficulty
  trackingType: TrackingType
  quantityGoal?: number
  unit?: string
}

export interface RouteDef {
  id: RouteId
  name: string
  icon: string
  summary: string
  /** Texto de la pasiva para un porcentaje dado. */
  passive: (percent: number) => string
  /** Actividades distintas exigidas por d\u00eda en el primer tramo. */
  baseMinPerDay: number
  activities: RouteActivityTemplate[]
}

export const ROUTES: Record<RouteId, RouteDef> = {
  'vampire-hunter': {
    id: 'vampire-hunter',
    name: 'Vampire Hunter',
    icon: '\u{1F5E1}\uFE0F',
    summary: 'Forja el cuerpo con ejercicio constante.',
    passive: (percent) => `Precios de la tienda -${percent} %`,
    baseMinPerDay: 3,
    activities: [
      { title: 'Flexiones', difficulty: 'medium', trackingType: 'quantity', quantityGoal: 20, unit: 'reps' },
      { title: 'Sentadillas', difficulty: 'medium', trackingType: 'quantity', quantityGoal: 30, unit: 'reps' },
      { title: 'Abdominales', difficulty: 'medium', trackingType: 'quantity', quantityGoal: 50, unit: 'reps' },
      { title: 'Correr', difficulty: 'hard', trackingType: 'boolean' },
      { title: 'Estirar', difficulty: 'easy', trackingType: 'boolean' },
    ],
  },
  technomancer: {
    id: 'technomancer',
    name: 'Technomancer',
    icon: '\u{1F52E}',
    summary: 'Domina la programaci\u00f3n y construye esta aplicaci\u00f3n.',
    passive: (percent) => `+${percent} % de EXP`,
    baseMinPerDay: 2,
    activities: [
      { title: 'Estudiar programaci\u00f3n', difficulty: 'hard', trackingType: 'quantity', quantityGoal: 60, unit: 'min' },
      { title: 'Trabajar en H\u00e1bitos', difficulty: 'medium', trackingType: 'quantity', quantityGoal: 30, unit: 'min' },
      { title: 'Repasar lo aprendido', difficulty: 'easy', trackingType: 'boolean' },
    ],
  },
  'castle-within': {
    id: 'castle-within',
    name: 'Castle Within',
    icon: '\u{1F54A}\uFE0F',
    summary: 'Cuida tu mente y tu mejora personal.',
    passive: (percent) =>
      `+${percent} % de vida m\u00e1xima y un escudo que absorbe 1 fallo (se recarga en ${SHIELD_RECHARGE_DAYS} d\u00edas)`,
    baseMinPerDay: 2,
    activities: [
      { title: 'Sesi\u00f3n con la psic\u00f3loga', difficulty: 'medium', trackingType: 'boolean' },
      { title: 'Escribir el diario', difficulty: 'easy', trackingType: 'boolean' },
      { title: 'Meditar', difficulty: 'easy', trackingType: 'quantity', quantityGoal: 10, unit: 'min' },
      { title: 'Respiraci\u00f3n consciente', difficulty: 'trivial', trackingType: 'boolean' },
    ],
  },
}

export const ROUTE_IDS = Object.keys(ROUTES) as RouteId[]

export function defaultRoutes(): Record<RouteId, RouteProgress> {
  return {
    'vampire-hunter': { level: 0 },
    technomancer: { level: 0 },
    'castle-within': { level: 0 },
  }
}

/** 10 % en el nivel 1 y +5 % por nivel adicional, hasta un 30 %. */
export function passivePercent(level: number): number {
  if (level <= 0) return 0
  return 10 + 5 * (Math.min(level, MAX_ROUTE_LEVEL) - 1)
}

export interface TierRule {
  minPerDay: number
  goodDays: number
  windowDays: number
}

/** Los tramos posteriores exigen m\u00e1s actividades por d\u00eda y m\u00e1s d\u00edas buenos. */
export function tierRule(def: RouteDef, tier: number): TierRule {
  return {
    minPerDay: Math.min(def.activities.length, def.baseMinPerDay + tier - 1),
    goodDays: Math.min(25, 19 + tier),
    windowDays: WINDOW_DAYS,
  }
}

function doneCount(
  linked: Item[],
  completionsByItem: Record<string, Completion[]>,
  dateKey: string,
): number {
  let done = 0
  for (const item of linked) {
    if (isCompletedOn(item, completionsByItem[item.id] ?? [], dateKey)) done += 1
  }
  return done
}

const dayKey = (date: Date) => format(date, 'yyyy-MM-dd')

/**
 * Avanza la ruta de forma determinista a partir de los datos: sube de nivel al alcanzar
 * los d\u00edas buenos de la ventana y reinicia el tramo si la ventana termina sin lograrlo.
 */
export function evaluateRoute(
  def: RouteDef,
  progress: RouteProgress,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  todayKey: string,
): RouteProgress {
  if (!progress.windowStart) return progress

  const linked = items.filter((item) => item.routeId === def.id)
  let { level, windowStart } = progress

  while (level < MAX_ROUTE_LEVEL) {
    const rule = tierRule(def, level + 1)
    const start = parseISO(windowStart)
    let good = 0
    let reachedOn: Date | null = null

    for (let i = 0; i < rule.windowDays && !reachedOn; i++) {
      const day = addDays(start, i)
      if (dayKey(day) > todayKey) break
      if (doneCount(linked, completionsByItem, dayKey(day)) >= rule.minPerDay) good += 1
      if (good >= rule.goodDays) reachedOn = day
    }

    if (reachedOn) {
      level += 1
      windowStart = dayKey(addDays(reachedOn, 1))
      continue
    }

    const lastDay = addDays(start, rule.windowDays - 1)
    if (dayKey(lastDay) >= todayKey) break
    windowStart = dayKey(addDays(lastDay, 1))
  }

  if (level === progress.level && windowStart === progress.windowStart) return progress
  return { ...progress, level, windowStart }
}

export interface RouteStatus {
  maxed: boolean
  tier: number
  rule: TierRule
  goodDays: number
  /** D\u00eda actual dentro de la ventana (1-30). */
  dayInWindow: number
  doneToday: number
}

export function routeStatus(
  def: RouteDef,
  progress: RouteProgress,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  todayKey: string,
): RouteStatus {
  const maxed = progress.level >= MAX_ROUTE_LEVEL
  const tier = Math.min(progress.level + 1, MAX_ROUTE_LEVEL)
  const rule = tierRule(def, tier)
  const linked = items.filter((item) => item.routeId === def.id)
  const start = parseISO(progress.windowStart ?? todayKey)

  let goodDays = 0
  for (let i = 0; i < rule.windowDays; i++) {
    const key = dayKey(addDays(start, i))
    if (key > todayKey) break
    if (doneCount(linked, completionsByItem, key) >= rule.minPerDay) goodDays += 1
  }

  const elapsed = differenceInCalendarDays(parseISO(todayKey), start) + 1
  return {
    maxed,
    tier,
    rule,
    goodDays,
    dayInWindow: Math.min(rule.windowDays, Math.max(1, elapsed)),
    doneToday: doneCount(linked, completionsByItem, todayKey),
  }
}

export interface ActivePassive {
  id: RouteId
  percent: number
}

/** La \u00fanica pasiva en vigor: la del oficio equipado, si ya tiene alg\u00fan nivel. */
export function activePassive(profile: PlayerProfile | null): ActivePassive | null {
  const id = profile?.equippedRoute
  if (!profile || !id) return null
  const percent = passivePercent(profile.routes[id]?.level ?? 0)
  return percent > 0 ? { id, percent } : null
}

/** Precio final en la tienda, con el descuento de Vampire Hunter. */
export function shopPrice(cost: number, profile: PlayerProfile | null): number {
  const passive = activePassive(profile)
  if (passive?.id !== 'vampire-hunter') return cost
  return Math.max(1, Math.floor((cost * (100 - passive.percent)) / 100))
}

export function xpWithBonus(xp: number, profile: PlayerProfile | null): number {
  const passive = activePassive(profile)
  if (passive?.id !== 'technomancer') return xp
  return Math.round((xp * (100 + passive.percent)) / 100)
}

/** Vida m\u00e1xima real: la base m\u00e1s el bono de Castle Within si est\u00e1 equipado. */
export function effectiveMaxHp(profile: PlayerProfile): number {
  const passive = activePassive(profile)
  if (passive?.id !== 'castle-within') return profile.maxHp
  return Math.round((profile.maxHp * (100 + passive.percent)) / 100)
}

export function hasShield(profile: PlayerProfile | null): boolean {
  return activePassive(profile)?.id === 'castle-within'
}
