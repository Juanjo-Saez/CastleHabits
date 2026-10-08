import { differenceInCalendarDays, format, parseISO } from 'date-fns'

/** Clave del día actual en formato yyyy-MM-dd, usada como identificador de "hoy". */
export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Tiempo restante hasta una fecha límite yyyy-MM-dd, en días naturales. */
export function describeDaysLeft(dueDate: string): string {
  const days = differenceInCalendarDays(parseISO(dueDate), new Date())
  if (days > 1) return `Faltan ${days} días`
  if (days === 1) return 'Falta 1 día'
  if (days === 0) return 'Vence hoy'
  return days === -1 ? 'Venció ayer' : `Venció hace ${-days} días`
}
