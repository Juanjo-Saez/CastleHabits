import { addDays, addMonths, format, parseISO } from 'date-fns'
import type { Reminder, ReminderUnit } from '../types'
import { todayKey } from './date'

const KEY_FORMAT = 'yyyy-MM-dd'

/** Día (yyyy-MM-dd) desde el que se cuenta el intervalo: última vez hecho o fecha de creación. */
export function reminderBaseKey(reminder: Reminder): string {
  return reminder.lastDoneOn ?? reminder.createdAt.slice(0, 10)
}

/** Día (yyyy-MM-dd) en el que vuelve a corresponder el aviso. */
export function nextReminderDate(reminder: Reminder): string {
  const base = parseISO(reminderBaseKey(reminder))
  const next =
    reminder.unit === 'month' ? addMonths(base, reminder.every) : addDays(base, reminder.every)
  return format(next, KEY_FORMAT)
}

/** ¿Debe mostrarse el aviso hoy? Respeta "Más tarde" y los archivados. */
export function isReminderDue(reminder: Reminder, key: string = todayKey()): boolean {
  if (reminder.archived) return false
  if (reminder.snoozedUntil && key < reminder.snoozedUntil) return false
  return key >= nextReminderDate(reminder)
}

/** Día (yyyy-MM-dd) siguiente al indicado; usado para "Más tarde". */
export function tomorrowKey(key: string = todayKey()): string {
  return format(addDays(parseISO(key), 1), KEY_FORMAT)
}

export function describeReminderInterval(every: number, unit: ReminderUnit): string {
  if (unit === 'month') return every === 1 ? 'Cada mes' : `Cada ${every} meses`
  return every === 1 ? 'Cada día' : `Cada ${every} días`
}
