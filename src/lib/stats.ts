import { addDays, format, startOfDay } from 'date-fns'
import { logicalNow } from './date'
import { itemEventId } from './itemEvents'
import { isObligation, isWindowClosingOn, isWindowCompleted, windowDaysOf } from './recurrence'
import type { Completion, Item, ItemEvent } from '../types'

/**
 * empty: no había obligaciones · complete: todas cumplidas · protected: fallo absorbido por escudo o congelación
 * · damaged: fallo que hizo daño · partial: algunas cumplidas sin daño registrado.
 */
export type DayStatus = 'empty' | 'complete' | 'partial' | 'protected' | 'damaged'

export interface DayStat {
  key: string
  status: DayStatus
  /** Proporción de obligaciones cumplidas (null = no había ninguna). */
  ratio: number | null
  /** Obligaciones debidas ese día. */
  due: number
  /** Obligaciones cumplidas ese día. */
  obligationsDone: number
  /** Completadas ese día, incluidas misiones secundarias. */
  completions: number
}

function statusOf(due: number, done: number, damaged: boolean, protectedMiss: boolean): DayStatus {
  if (due === 0) return 'empty'
  if (done === due) return 'complete'
  if (damaged) return 'damaged'
  if (protectedMiss) return 'protected'
  return 'partial'
}

/**
 * Estadísticas diarias de los últimos `days` días (incluyendo hoy).
 * El estado solo cuenta obligaciones; `missedEvents` aporta el daño o escudo ya registrado.
 */
export function buildDailyStats(
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  days: number,
  missedEvents: ItemEvent[] = [],
): DayStat[] {
  const trackable = items.filter((item) => item.type !== 'todo' && !item.archived)
  const missedById = new Map(missedEvents.map((event) => [event.id, event]))
  const today = startOfDay(logicalNow())
  const stats: DayStat[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const key = format(date, 'yyyy-MM-dd')
    let due = 0
    let done = 0
    let completions = 0
    let damaged = false
    let protectedMiss = false

    for (const item of trackable) {
      if (!isWindowClosingOn(item, date)) continue
      const completed = isWindowCompleted(item, completionsByItem[item.id] ?? [], key)
      if (completed) completions += 1
      if (!isObligation(item)) continue

      due += 1
      if (completed) {
        done += 1
        continue
      }
      // Los eventos de fallo se registran en la apertura de la ventana, no en su cierre.
      const scheduledKey = format(addDays(date, -(windowDaysOf(item) - 1)), 'yyyy-MM-dd')
      const miss = missedById.get(itemEventId(item.id, scheduledKey, 'missed'))
      if (!miss) continue
      if ((miss.damage ?? 0) > 0) damaged = true
      else if (miss.protectedBy) protectedMiss = true
    }

    stats.push({
      key,
      status: statusOf(due, done, damaged, protectedMiss),
      ratio: due > 0 ? done / due : null,
      due,
      obligationsDone: done,
      completions,
    })
  }

  return stats
}
