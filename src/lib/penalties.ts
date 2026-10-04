import { addDays, format, isBefore, parseISO, startOfDay } from 'date-fns'
import { isCompletedOn, isItemDueOn, isObligation } from './recurrence'
import type { Completion, Item } from '../types'

/**
 * Daño por una racha de incumplimientos: 1, 1, 2, 2, 3, 4, 5...
 * La racha cuenta apariciones debidas, por lo que funciona igual para tareas
 * diarias, semanales, quincenales y mensuales.
 */
export function damageForMissedStreak(missedStreak: number): number {
  if (missedStreak <= 0) return 0
  if (missedStreak <= 2) return 1
  if (missedStreak <= 4) return 2
  return missedStreak - 2
}

function missedStreakBefore(
  item: Item,
  date: Date,
  completions: Completion[],
): number {
  let streak = 0
  let cursor = startOfDay(parseISO(item.createdAt))
  const dayBefore = addDays(startOfDay(date), -1)

  while (!isBefore(dayBefore, cursor)) {
    const key = format(cursor, 'yyyy-MM-dd')
    if (isItemDueOn(item, cursor)) {
      streak = isCompletedOn(item, completions, key) ? 0 : streak + 1
    }
    cursor = addDays(cursor, 1)
  }
  return streak
}

/**
 * Calcula el daño acumulado por obligaciones vencidas sin completar desde la última
 * comprobación hasta ayer (nunca se penaliza el día de hoy, que aún no ha acabado).
 * Si nunca se ha comprobado antes, solo se revisa el día de ayer para no
 * penalizar retroactivamente todo el historial; la racha previa sí se usa
 * para que la progresión no se reinicie por cerrar la aplicación.
 */
export function computeMissedPenalties(
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  lastCheckedDate: string | undefined,
): { totalDamage: number; newLastChecked: string } {
  const yesterday = addDays(startOfDay(new Date()), -1)
  let cursor = lastCheckedDate ? addDays(parseISO(lastCheckedDate), 1) : yesterday

  let totalDamage = 0
  while (!isBefore(yesterday, cursor)) {
    const key = format(cursor, 'yyyy-MM-dd')
    for (const item of items) {
      if (item.archived || !isObligation(item)) continue
      if (!isItemDueOn(item, cursor)) continue
      if (!isCompletedOn(item, completionsByItem[item.id] ?? [], key)) {
        const streak = missedStreakBefore(item, cursor, completionsByItem[item.id] ?? []) + 1
        totalDamage += damageForMissedStreak(streak)
      }
    }
    cursor = addDays(cursor, 1)
  }

  return { totalDamage, newLastChecked: format(yesterday, 'yyyy-MM-dd') }
}
