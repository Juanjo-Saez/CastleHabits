import { addDays, format, isBefore, parseISO, startOfDay } from 'date-fns'
import { isDueOn } from './recurrence'
import type { Completion, Item } from '../types'

function isItemDueOn(item: Item, date: Date): boolean {
  if (item.type === 'todo') return false
  // Los hábitos sin recurrenceRule se consideran diarios.
  if (!item.recurrenceRule) return true
  return isDueOn(item.recurrenceRule, date)
}

function isCompletedOn(
  item: Item,
  completions: Completion[],
  dateKey: string,
): boolean {
  const completion = completions.find((c) => c.date === dateKey)
  if (!completion) return false
  if (item.trackingType === 'quantity') {
    return (completion.quantityDone ?? 0) >= (item.quantityGoal ?? 0)
  }
  return true
}

/** Racha de días "debidos" consecutivos completados, terminando hoy o ayer. */
export function computeStreak(item: Item, completions: Completion[]): number {
  if (item.type === 'todo') return 0

  let streak = 0
  let cursor = startOfDay(new Date())
  const createdAt = startOfDay(parseISO(item.createdAt))

  // Si hoy toca pero aún no se ha completado, no rompemos la racha: empezamos desde ayer.
  if (
    isItemDueOn(item, cursor) &&
    !isCompletedOn(item, completions, format(cursor, 'yyyy-MM-dd'))
  ) {
    cursor = addDays(cursor, -1)
  }

  while (!isBefore(cursor, createdAt)) {
    const key = format(cursor, 'yyyy-MM-dd')
    if (isItemDueOn(item, cursor)) {
      if (isCompletedOn(item, completions, key)) {
        streak += 1
      } else {
        break
      }
    }
    cursor = addDays(cursor, -1)
  }

  return streak
}

/** Puntuación 0-100 con media móvil suavizada (similar a Loop Habit Tracker). */
export function computeScore(item: Item, completions: Completion[]): number {
  if (item.type === 'todo') return 0

  const SMOOTHING = 0.15
  let score = 0
  let cursor = startOfDay(parseISO(item.createdAt))
  const today = startOfDay(new Date())

  while (!isBefore(today, cursor)) {
    const key = format(cursor, 'yyyy-MM-dd')
    if (isItemDueOn(item, cursor)) {
      const done = isCompletedOn(item, completions, key)
      score += SMOOTHING * ((done ? 1 : 0) - score)
    }
    cursor = addDays(cursor, 1)
  }

  return Math.round(score * 100)
}
