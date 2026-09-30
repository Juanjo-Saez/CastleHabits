import { addDays, format, startOfDay } from 'date-fns'
import { isCompletedOn, isItemDueOn } from './recurrence'
import type { Completion, Item } from '../types'

export interface DayStat {
  key: string
  /** Proporción de items debidos que se completaron ese día (null = no había nada debido). */
  ratio: number | null
  completions: number
}

/** Estadísticas diarias de los últimos `days` días (incluyendo hoy), para hábitos y tareas recurrentes. */
export function buildDailyStats(
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  days: number,
): DayStat[] {
  const trackable = items.filter((item) => item.type !== 'todo' && !item.archived)
  const today = startOfDay(new Date())
  const stats: DayStat[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const key = format(date, 'yyyy-MM-dd')
    let due = 0
    let done = 0
    for (const item of trackable) {
      if (!isItemDueOn(item, date)) continue
      due += 1
      if (isCompletedOn(item, completionsByItem[item.id] ?? [], key)) done += 1
    }
    stats.push({ key, ratio: due > 0 ? done / due : null, completions: done })
  }

  return stats
}
