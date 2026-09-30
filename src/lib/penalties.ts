import { addDays, format, isBefore, parseISO, startOfDay } from 'date-fns'
import { DIFFICULTY_DAMAGE } from './gamification'
import { isDueOn } from './recurrence'
import type { Completion, Item } from '../types'

function isItemDueOn(item: Item, date: Date): boolean {
  if (item.type === 'todo') return false
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

/**
 * Calcula el daño acumulado por tareas vencidas sin completar desde la última
 * comprobación hasta ayer (nunca se penaliza el día de hoy, que aún no ha acabado).
 * Si nunca se ha comprobado antes, solo se revisa el día de ayer para no
 * penalizar retroactivamente todo el historial.
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
      if (item.archived || item.type === 'todo') continue
      if (!isItemDueOn(item, cursor)) continue
      if (!isCompletedOn(item, completionsByItem[item.id] ?? [], key)) {
        totalDamage += DIFFICULTY_DAMAGE[item.difficulty]
      }
    }
    cursor = addDays(cursor, 1)
  }

  return { totalDamage, newLastChecked: format(yesterday, 'yyyy-MM-dd') }
}
