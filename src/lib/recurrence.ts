import { isBefore, parseISO, startOfDay } from 'date-fns'
import { RRule } from 'rrule'
import type { Completion, Item } from '../types'

export type RecurrenceKind = 'daily' | 'interval' | 'weekdays' | 'monthly'

export interface RecurrenceInput {
  kind: RecurrenceKind
  /** Para "interval": cada cuántos días. */
  interval?: number
  /** Para "weekdays": 0=lunes ... 6=domingo. */
  weekdays?: number[]
  /** Para "monthly": día del mes (1-31). */
  monthDay?: number
}

const RRULE_WEEKDAYS = [
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
  RRule.SU,
]

const WEEKDAY_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function buildRecurrenceRule(input: RecurrenceInput, anchor: Date): string {
  switch (input.kind) {
    case 'daily':
      return new RRule({ freq: RRule.DAILY, dtstart: anchor }).toString()
    case 'interval':
      return new RRule({
        freq: RRule.DAILY,
        interval: Math.max(2, input.interval ?? 2),
        dtstart: anchor,
      }).toString()
    case 'weekdays':
      return new RRule({
        freq: RRule.WEEKLY,
        byweekday: (input.weekdays?.length ? input.weekdays : [0]).map(
          (d) => RRULE_WEEKDAYS[d],
        ),
        dtstart: anchor,
      }).toString()
    case 'monthly':
      return new RRule({
        freq: RRule.MONTHLY,
        bymonthday: [input.monthDay ?? 1],
        dtstart: anchor,
      }).toString()
  }
}

/** ¿El item recurrente cae en la fecha dada? */
export function isDueOn(
  recurrenceRule: string | null | undefined,
  date: Date,
): boolean {
  if (!recurrenceRule) return false
  try {
    const rule = RRule.fromString(recurrenceRule)
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    return rule.between(start, end, true).length > 0
  } catch {
    return false
  }
}

/** Descripción corta en español de la regla, para mostrar en la tarjeta. */
export function describeRecurrence(
  recurrenceRule: string | null | undefined,
): string {
  if (!recurrenceRule) return ''
  try {
    const rule = RRule.fromString(recurrenceRule)
    const { freq, interval, byweekday, bymonthday } = rule.options
    if (freq === RRule.DAILY) {
      return interval > 1 ? `Cada ${interval} días` : 'Cada día'
    }
    if (freq === RRule.WEEKLY && byweekday?.length) {
      const days = [...byweekday]
        .sort((a, b) => a - b)
        .map((d: number) => WEEKDAY_SHORT[d])
        .join(' ')
      return `Semanal: ${days}`
    }
    if (freq === RRule.MONTHLY && bymonthday?.length) {
      return `Día ${bymonthday[0]} de cada mes`
    }
    return 'Recurrente'
  } catch {
    return ''
  }
}

/** ¿El item "debe" hacerse en esa fecha? Los hábitos sin recurrenceRule son diarios. */
export function isItemDueOn(item: Item, date: Date): boolean {
  if (item.type === 'todo') return false
  if (isBefore(startOfDay(date), startOfDay(parseISO(item.createdAt)))) return false
  if (!item.recurrenceRule) return true
  return isDueOn(item.recurrenceRule, date)
}

/** ¿Se completó el item en esa fecha (yyyy-MM-dd), según su tipo de seguimiento? */
export function isCompletedOn(
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

