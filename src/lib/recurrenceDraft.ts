import { addDays, addMonths, format, getDay, startOfMonth } from 'date-fns'
import { todayKey } from './date'
import {
  buildRecurrenceRule,
  LAST_MONTH_DAY,
  type RecurrenceUnit,
} from './recurrence'

/** Estado editable del formulario de frecuencia. */
export interface RecurrenceDraft {
  unit: RecurrenceUnit
  interval: number
  weekdays: number[]
  monthDay: number
  lastDay: boolean
  startDate: string
}

export function defaultRecurrenceDraft(): RecurrenceDraft {
  const now = new Date()
  return {
    unit: 'day',
    interval: 1,
    weekdays: [(getDay(now) + 6) % 7],
    monthDay: now.getDate(),
    lastDay: false,
    startDate: todayKey(),
  }
}

export function ruleFromDraft(draft: RecurrenceDraft): string {
  return buildRecurrenceRule(
    {
      unit: draft.unit,
      interval: draft.interval,
      weekdays: draft.weekdays,
      monthDay: draft.lastDay ? LAST_MONTH_DAY : draft.monthDay,
    },
    draft.startDate,
  )
}

export function isDraftValid(draft: RecurrenceDraft): boolean {
  if (!draft.startDate || draft.startDate < todayKey()) return false
  if (draft.unit === 'week') return draft.weekdays.length > 0
  if (draft.unit === 'month') return draft.lastDay || (draft.monthDay >= 1 && draft.monthDay <= 31)
  return true
}

/** Atajos de fecha de inicio para el selector. */
export function startDatePresets(): { label: string; value: string }[] {
  const now = new Date()
  return [
    { label: 'Hoy', value: format(now, 'yyyy-MM-dd') },
    { label: 'Mañana', value: format(addDays(now, 1), 'yyyy-MM-dd') },
    { label: 'Mes próximo', value: format(startOfMonth(addMonths(now, 1)), 'yyyy-MM-dd') },
  ]
}
