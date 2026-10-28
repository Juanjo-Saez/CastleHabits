import { differenceInCalendarDays, format, parseISO, subHours } from 'date-fns'

/** Hora a la que empieza el nuevo día: lo que se hace de madrugada cuenta como del día anterior. */
export const DAY_START_HOUR = 2

/** Momento lógico actual, retrasado para que el día cambie a las 02:00 y no a medianoche. */
export function logicalNow(): Date {
  return subHours(new Date(), DAY_START_HOUR)
}

/** Clave del día operativo actual en formato yyyy-MM-dd, usada como identificador de "hoy". */
export function todayKey(): string {
  return format(logicalNow(), 'yyyy-MM-dd')
}

export function activityDateKey(timestamp: string): string {
  return format(subHours(parseISO(timestamp), DAY_START_HOUR), 'yyyy-MM-dd')
}

/** Tiempo restante hasta una fecha límite yyyy-MM-dd, en días naturales. */
export function describeDaysLeft(dueDate: string): string {
  const days = differenceInCalendarDays(parseISO(dueDate), logicalNow())
  if (days > 1) return `Faltan ${days} días`
  if (days === 1) return 'Falta 1 día'
  if (days === 0) return 'Vence hoy'
  return days === -1 ? 'Venció ayer' : `Venció hace ${-days} días`
}
