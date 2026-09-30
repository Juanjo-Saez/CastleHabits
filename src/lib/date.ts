import { format } from 'date-fns'

/** Clave del día actual en formato yyyy-MM-dd, usada como identificador de "hoy". */
export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
