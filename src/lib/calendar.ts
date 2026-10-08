import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'
import { isCompletedOn, isItemDueOn, isObligation } from './recurrence'
import type { Completion, Item } from '../types'

/** Todos los días visibles de un mes, en semanas completas que empiezan en lunes. */
export function monthGridDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days: Date[] = []
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day)
  return days
}

export interface DayCandles {
  /** Tareas ya cumplidas ese día. */
  lit: number
  /** Obligaciones aún por cumplir (solo hoy y días futuros). */
  unlit: number
}

function isDoneOn(item: Item, completion: Completion): boolean {
  return isCompletedOn(item, [completion], completion.date)
}

/** Velas de cada día: cumplidas en el pasado y hoy, y carga prevista de obligaciones desde hoy. */
export function buildCandlesByDay(
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  days: Date[],
  today: Date,
): Map<string, DayCandles> {
  const todayKey = format(today, 'yyyy-MM-dd')
  const result = new Map<string, DayCandles>()
  for (const day of days) result.set(format(day, 'yyyy-MM-dd'), { lit: 0, unlit: 0 })

  for (const item of items) {
    for (const completion of completionsByItem[item.id] ?? []) {
      const entry = result.get(completion.date)
      if (entry && isDoneOn(item, completion)) entry.lit += 1
    }
  }

  for (const item of items) {
    if (item.archived || !isObligation(item)) continue
    const history = completionsByItem[item.id] ?? []
    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd')
      if (key < todayKey || !isItemDueOn(item, day)) continue
      if (isCompletedOn(item, history, key)) continue
      const entry = result.get(key)
      if (entry) entry.unlit += 1
    }
  }

  return result
}

export interface DayDoneEntry {
  id: string
  title: string
  xp: number
  coins: number
  quantityDone?: number
  unit?: string
}

export interface DaySummary {
  done: DayDoneEntry[]
  xp: number
  coins: number
  /** Obligaciones previstas ese día que no se han cumplido. */
  open: Item[]
}

export function buildDaySummary(
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  date: Date,
): DaySummary {
  const key = format(date, 'yyyy-MM-dd')
  const done: DayDoneEntry[] = []
  const open: Item[] = []

  for (const item of items) {
    const history = completionsByItem[item.id] ?? []
    const completion = history.find((c) => c.date === key)
    if (completion && isDoneOn(item, completion)) {
      done.push({
        id: item.id,
        title: item.title,
        xp: completion.xpEarned,
        coins: completion.coinsEarned,
        quantityDone: item.trackingType === 'quantity' ? completion.quantityDone : undefined,
        unit: item.unit,
      })
    } else if (!item.archived && isObligation(item) && isItemDueOn(item, date)) {
      open.push(item)
    }
  }

  return {
    done,
    xp: done.reduce((sum, entry) => sum + entry.xp, 0),
    coins: done.reduce((sum, entry) => sum + entry.coins, 0),
    open,
  }
}
