import { format, isBefore, isSameDay, parseISO, setHours, startOfDay } from 'date-fns'
import { RRule } from 'rrule'
import type { Completion, Item } from '../types'

export type RecurrenceUnit = 'day' | 'week' | 'month'

/** Valor de `monthDay` para "último día del mes". */
export const LAST_MONTH_DAY = -1

/** Los registros antiguos no tienen commitment y se conservan como obligaciones. */
export function isObligation(item: Item): boolean {
  return item.commitment !== 'sideQuest'
}

export interface RecurrenceInput {
  unit: RecurrenceUnit
  /** Cada cuántas unidades se repite (mínimo 1). */
  interval: number
  /** Para "week": 0=lunes ... 6=domingo. */
  weekdays?: number[]
  /** Para "month": día del mes (1-31) o LAST_MONTH_DAY. */
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

/** La regla se ancla al mediodía local de `startDate` para que ningún huso desplace el día en rrule (UTC). */
export function buildRecurrenceRule(input: RecurrenceInput, startDate: string): string {
  const dtstart = setHours(parseISO(startDate), 12)
  const interval = Math.max(1, Math.floor(input.interval) || 1)

  switch (input.unit) {
    case 'day':
      return new RRule({ freq: RRule.DAILY, interval, dtstart }).toString()
    case 'week':
      return new RRule({
        freq: RRule.WEEKLY,
        interval,
        byweekday: (input.weekdays?.length ? input.weekdays : [0]).map(
          (d) => RRULE_WEEKDAYS[d],
        ),
        dtstart,
      }).toString()
    case 'month':
      return new RRule({
        freq: RRule.MONTHLY,
        interval,
        bymonthday: [input.monthDay ?? 1],
        dtstart,
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

function describeWeekly(interval: number, byweekday: number[]): string {
  const days = [...byweekday]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_SHORT[d])
    .join(' ')
  const prefix = interval > 1 ? `Cada ${interval} semanas` : 'Semanal'
  return `${prefix}: ${days}`
}

function describeMonthly(interval: number, bymonthday: number[], bynmonthday: number[]): string | null {
  // rrule separa los días negativos (último día) en bynmonthday.
  let day: string | null = null
  if (bynmonthday.includes(LAST_MONTH_DAY)) day = 'Último día'
  else if (bymonthday.length) day = `Día ${bymonthday[0]}`
  if (!day) return null
  return interval > 1 ? `${day} cada ${interval} meses` : `${day} de cada mes`
}

/** Descripción corta en español de la regla, para mostrar en la tarjeta. */
export function describeRecurrence(
  recurrenceRule: string | null | undefined,
): string {
  if (!recurrenceRule) return ''
  try {
    const rule = RRule.fromString(recurrenceRule)
    const { freq, interval, byweekday, bymonthday, bynmonthday } = rule.options
    if (freq === RRule.DAILY) {
      return interval > 1 ? `Cada ${interval} días` : 'Cada día'
    }
    if (freq === RRule.WEEKLY && byweekday?.length) return describeWeekly(interval, byweekday)
    if (freq === RRule.MONTHLY) {
      return describeMonthly(interval, bymonthday ?? [], bynmonthday ?? []) ?? 'Recurrente'
    }
    return 'Recurrente'
  } catch {
    return ''
  }
}

/** ¿El item "debe" hacerse en esa fecha? Los hábitos sin recurrenceRule son diarios. */
export function isItemDueOn(item: Item, date: Date): boolean {
  const dateKey = format(date, 'yyyy-MM-dd')
  if (item.postponedUntil === dateKey) return true
  if (item.postponedFrom === dateKey && item.postponedUntil !== dateKey) return false
  if (item.type === 'todo') {
    return Boolean(item.dueDate && isSameDay(parseISO(item.dueDate), date))
  }
  if (isBefore(startOfDay(date), startOfDay(parseISO(item.createdAt)))) return false
  if (item.startDate && dateKey < item.startDate) return false
  if (!item.recurrenceRule) return true
  return isDueOn(item.recurrenceRule, date)
}

/** Fecha de la aparición original representada por la tarea en una fecha concreta. */
export function scheduledDateFor(item: Item, date: Date): string {
  const dateKey = format(date, 'yyyy-MM-dd')
  if (item.postponedFrom && item.postponedUntil && dateKey >= item.postponedUntil) {
    return item.postponedFrom
  }
  if (item.type === 'todo' && item.dueDate) return item.dueDate
  return dateKey
}

/** Un pergamino puntual ya cumplido antes de `dateKey` deja de ser una tarea pendiente. */
export function isTodoClosedBefore(
  item: Item,
  completions: Completion[],
  dateKey: string,
): boolean {
  return item.type === 'todo' && completions.some((c) => c.date < dateKey)
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

