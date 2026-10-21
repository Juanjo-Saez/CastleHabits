import { addDays, addMonths, format, getDay, startOfMonth } from 'date-fns'
import { logicalNow, todayKey } from './date'
import {
  buildRecurrenceRule,
  LAST_MONTH_DAY,
  maxWindowForRule,
  type RecurrenceUnit,
} from './recurrence'

/** Margen por defecto al activar una recurrencia con margen. */
export const DEFAULT_WINDOW_DAYS = 7

/** Estado editable del formulario de frecuencia. */
export interface RecurrenceDraft {
  unit: RecurrenceUnit
  interval: number
  weekdays: number[]
  monthDay: number
  lastDay: boolean
  startDate: string
  /** Días para cumplirla desde su aparición; 1 = solo ese día. */
  windowDays: number
}

export function defaultRecurrenceDraft(): RecurrenceDraft {
  const now = logicalNow()
  return {
    unit: 'day',
    interval: 1,
    weekdays: [(getDay(now) + 6) % 7],
    monthDay: now.getDate(),
    lastDay: false,
    startDate: todayKey(),
    windowDays: 1,
  }
}

/** Margen que se guarda en el item; undefined cuando no hay margen. */
export function windowFromDraft(draft: RecurrenceDraft): number | undefined {
  return draft.windowDays > 1 ? draft.windowDays : undefined
}

/** Margen máximo de la frecuencia; no depende de la fecha de inicio. */
export function maxWindowFromDraft(draft: RecurrenceDraft): number {
  try {
    return maxWindowForRule(ruleFromDraft({ ...draft, startDate: todayKey() }))
  } catch {
    return 1
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

export function isDraftValid(draft: RecurrenceDraft, allowPastStartDate = false): boolean {
  if (!draft.startDate || (!allowPastStartDate && draft.startDate < todayKey())) return false
  const windowOk =
    Number.isInteger(draft.windowDays) &&
    draft.windowDays >= 1 &&
    draft.windowDays <= maxWindowFromDraft(draft)
  if (!windowOk) return false
  if (draft.unit === 'week') return draft.weekdays.length > 0
  if (draft.unit === 'month') return draft.lastDay || (draft.monthDay >= 1 && draft.monthDay <= 31)
  return true
}

/** Atajos de fecha de inicio para el selector. */
export function startDatePresets(): { label: string; value: string }[] {
  const now = logicalNow()
  return [
    { label: 'Hoy', value: format(now, 'yyyy-MM-dd') },
    { label: 'Mañana', value: format(addDays(now, 1), 'yyyy-MM-dd') },
    { label: 'Mes próximo', value: format(startOfMonth(addMonths(now, 1)), 'yyyy-MM-dd') },
  ]
}
