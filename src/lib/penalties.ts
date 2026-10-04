import { addDays, format, isBefore, parseISO, startOfDay } from 'date-fns'
import { buildItemEvent, itemEventId } from './itemEvents'
import { isCompletedOn, isItemDueOn, isObligation } from './recurrence'
import type { Completion, Item, ItemEvent } from '../types'

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
  availableStreakFreezes = 0,
): { totalDamage: number; newLastChecked: string; missedEvents: ItemEvent[]; freezesUsed: number } {
  const yesterday = addDays(startOfDay(new Date()), -1)
  let cursor = lastCheckedDate ? addDays(parseISO(lastCheckedDate), 1) : yesterday
  const streaks = new Map<string, number>()

  let totalDamage = 0
  let freezesUsed = 0
  const missedEvents: ItemEvent[] = []
  for (const item of items) {
    streaks.set(item.id, missedStreakBefore(item, cursor, completionsByItem[item.id] ?? []))
  }

  while (!isBefore(yesterday, cursor)) {
    const key = format(cursor, 'yyyy-MM-dd')
    for (const item of items) {
      if (item.archived || !isObligation(item)) continue
      if (!isItemDueOn(item, cursor)) continue
      const completions = completionsByItem[item.id] ?? []
      if (isCompletedOn(item, completions, key)) {
        streaks.set(item.id, 0)
        continue
      }

      if (freezesUsed < availableStreakFreezes) {
        freezesUsed += 1
        continue
      }

      const streak = (streaks.get(item.id) ?? 0) + 1
      streaks.set(item.id, streak)
      const damage = damageForMissedStreak(streak)
      totalDamage += damage
      missedEvents.push(
        buildItemEvent(item, 'missed', key, { damage }, itemEventId(item.id, key, 'missed')),
      )
    }
    cursor = addDays(cursor, 1)
  }

  return {
    totalDamage,
    newLastChecked: format(yesterday, 'yyyy-MM-dd'),
    missedEvents,
    freezesUsed,
  }
}
