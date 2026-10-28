import { create } from 'zustand'
import { db } from '../db/database'
import { buildDailySummary, summaryDateKey, type DailySummary } from '../lib/dailySummary'
import { hasShownSummary, markSummaryShown } from '../lib/summaryMarker'
import type { Completion } from '../types'

export type SummaryMode = 'auto' | 'manual'

interface DailySummaryState {
  open: boolean
  mode: SummaryMode
  loading: boolean
  summary: DailySummary | null
  error: string | null
  /** Abre el resumen de ayer si es la primera vez que se entra en este día operativo. */
  presentIfDue: () => Promise<void>
  /** Vuelve a leer los datos y abre el resumen de ayer, se haya mostrado ya o no. */
  openManual: () => Promise<void>
  close: () => void
}

/** Lee siempre de la base de datos: así refleja cualquier corrección reciente. */
async function loadSummary(date: string): Promise<DailySummary | null> {
  const [profile, items, completions, events, snapshot] = await Promise.all([
    db.profile.get(1),
    db.items.toArray(),
    db.completions.toArray(),
    db.itemEvents.toArray(),
    db.daySnapshots.get(date),
  ])
  if (!profile) return null
  const completionsByItem: Record<string, Completion[]> = {}
  for (const completion of completions) (completionsByItem[completion.itemId] ??= []).push(completion)
  return buildDailySummary({ date, profile, items, completionsByItem, events, snapshot })
}

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'No se pudo preparar el resumen de ayer.'
}

let presenting = false
let requestId = 0

export const useDailySummaryStore = create<DailySummaryState>((set) => ({
  open: false,
  mode: 'auto',
  loading: false,
  summary: null,
  error: null,

  presentIfDue: async () => {
    if (presenting) return
    presenting = true
    try {
      const date = summaryDateKey()
      if (hasShownSummary(date)) return
      const summary = await loadSummary(date)
      markSummaryShown(date)
      if (summary?.hasContent) set({ open: true, mode: 'auto', loading: false, summary, error: null })
    } catch (cause) {
      // No se marca como mostrado: se reintenta en la próxima carga y el fallo es visible.
      set({ open: true, mode: 'auto', loading: false, summary: null, error: messageOf(cause) })
    } finally {
      presenting = false
    }
  },

  openManual: async () => {
    const current = ++requestId
    set({ open: true, mode: 'manual', loading: true, summary: null, error: null })
    try {
      const summary = await loadSummary(summaryDateKey())
      if (current === requestId) set({ summary, loading: false })
    } catch (cause) {
      if (current === requestId) set({ loading: false, error: messageOf(cause) })
    }
  },

  close: () => {
    requestId += 1
    set({ open: false })
  },
}))
