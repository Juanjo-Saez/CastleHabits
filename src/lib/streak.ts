import { addDays, format, isBefore, parseISO, startOfDay } from 'date-fns'
import { logicalNow } from './date'
import { isObligation, isWindowClosingOn, isWindowCompleted } from './recurrence'
import type { Completion, Item } from '../types'

const RECENT_MISS_DAYS = 1

/** Racha de días "debidos" consecutivos completados, terminando hoy o ayer. */
export function computeStreak(item: Item, completions: Completion[]): number {
  if (item.type === 'todo') return 0

  let streak = 0
  let cursor = startOfDay(logicalNow())
  const createdAt = startOfDay(parseISO(item.createdAt))

  // Si hoy toca pero aún no se ha completado, no rompemos la racha: empezamos desde ayer.
  if (
    isWindowClosingOn(item, cursor) &&
    !isWindowCompleted(item, completions, format(cursor, 'yyyy-MM-dd'))
  ) {
    cursor = addDays(cursor, -1)
  }

  while (!isBefore(cursor, createdAt)) {
    const key = format(cursor, 'yyyy-MM-dd')
    if (isWindowClosingOn(item, cursor)) {
      if (isWindowCompleted(item, completions, key)) {
        streak += 1
      } else {
        break
      }
    }
    cursor = addDays(cursor, -1)
  }

  return streak
}

/**
 * Racha de apariciones consecutivas cumplidas hasta un día ya cerrado (yyyy-MM-dd), incluido.
 * A diferencia de `computeStreak`, ese día no se considera "en curso": si no se cumplió, la racha es 0.
 */
export function streakEndingOn(item: Item, completions: Completion[], dateKey: string): number {
  if (item.type === 'todo') return 0

  let streak = 0
  let cursor = parseISO(dateKey)
  const createdAt = startOfDay(parseISO(item.createdAt))
  while (!isBefore(cursor, createdAt)) {
    if (isWindowClosingOn(item, cursor)) {
      if (!isWindowCompleted(item, completions, format(cursor, 'yyyy-MM-dd'))) break
      streak += 1
    }
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Mejor racha histórica de apariciones consecutivas completadas. */
export function computeBestStreak(item: Item, completions: Completion[]): number {
  if (item.type === 'todo') return 0

  const today = startOfDay(logicalNow())
  let cursor = startOfDay(parseISO(item.createdAt))
  const endDate =
    isWindowClosingOn(item, today) &&
    !isWindowCompleted(item, completions, format(today, 'yyyy-MM-dd'))
      ? addDays(today, -1)
      : today

  let current = 0
  let best = 0
  while (!isBefore(endDate, cursor)) {
    const key = format(cursor, 'yyyy-MM-dd')
    if (isWindowClosingOn(item, cursor)) {
      if (isWindowCompleted(item, completions, key)) {
        current += 1
        best = Math.max(best, current)
      } else {
        current = 0
      }
    }
    cursor = addDays(cursor, 1)
  }

  return best
}

/** Puntuación 0-100 con media móvil suavizada (similar a Loop Habit Tracker). */
export function computeScore(item: Item, completions: Completion[]): number {
  if (item.type === 'todo') return 0

  const SMOOTHING = 0.15
  let score = 0
  let cursor = startOfDay(parseISO(item.createdAt))
  const today = startOfDay(logicalNow())

  while (!isBefore(today, cursor)) {
    const key = format(cursor, 'yyyy-MM-dd')
    if (isWindowClosingOn(item, cursor)) {
      const done = isWindowCompleted(item, completions, key)
      score += SMOOTHING * ((done ? 1 : 0) - score)
    }
    cursor = addDays(cursor, 1)
  }

  return Math.round(score * 100)
}

/** Apariciones cerradas sin completar hasta ayer, contadas hacia atrás. Hoy no cuenta: el día no ha terminado. */
export function computeMissStreak(item: Item, completions: Completion[]): number {
  if (!isObligation(item)) return 0

  let streak = 0
  let cursor = addDays(startOfDay(logicalNow()), -1)
  const createdAt = startOfDay(parseISO(item.createdAt))

  while (!isBefore(cursor, createdAt)) {
    if (isWindowClosingOn(item, cursor)) {
      if (isWindowCompleted(item, completions, format(cursor, 'yyyy-MM-dd'))) break
      streak += 1
    }
    cursor = addDays(cursor, -1)
  }

  return streak
}

/** Obligaciones cuya ventana cerró en los últimos días sin completarse, de ayer hacia atrás. */
export function recentMisses(
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  days = RECENT_MISS_DAYS,
): { item: Item; dateKey: string }[] {
  const today = startOfDay(logicalNow())
  const misses: { item: Item; dateKey: string }[] = []

  for (const item of items) {
    if (item.archived || !isObligation(item)) continue
    const createdAt = startOfDay(parseISO(item.createdAt))
    const history = completionsByItem[item.id] ?? []

    for (let offset = 1; offset <= days; offset += 1) {
      const day = addDays(today, -offset)
      if (isBefore(day, createdAt)) break
      const dateKey = format(day, 'yyyy-MM-dd')
      if (isWindowClosingOn(item, day) && !isWindowCompleted(item, history, dateKey)) {
        misses.push({ item, dateKey })
      }
    }
  }

  return misses
}
