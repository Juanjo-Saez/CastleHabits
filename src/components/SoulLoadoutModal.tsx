import { useState } from 'react'
import { soulDefinition, soulSlotsForLevel } from '../lib/souls'
import { todayKey } from '../lib/date'
import { useDailySummaryStore } from '../store/useDailySummaryStore'
import { usePlayerStore } from '../store/usePlayerStore'
import type { SoulId } from '../types'

function SoulLoadoutModal() {
  const profile = usePlayerStore((state) => state.profile)
  const setDailySoulLoadout = usePlayerStore((state) => state.setDailySoulLoadout)
  const summaryOpen = useDailySummaryStore((state) => state.open)
  const today = todayKey()
  const [selection, setSelection] = useState<{ date: string; ids: SoulId[] }>({ date: today, ids: [] })
  const selected = selection.date === today ? selection.ids : []
  const available = profile
    ? (Object.keys(profile.souls ?? {}) as SoulId[]).filter((id) => Boolean(profile.souls?.[id]))
    : []
  const slots = profile ? soulSlotsForLevel(profile.level) : 0
  const needsChoice = Boolean(
    profile
    && profile.dailySoulLoadout?.date !== today
    && available.length > 0
    && slots > 0
    && !summaryOpen,
  )

  if (!needsChoice) return null

  const toggle = (id: SoulId) => {
    setSelection((current) => {
      const selectedToday = current.date === today ? current.ids : []
      const ids = selectedToday.includes(id)
        ? selectedToday.filter((candidate) => candidate !== id)
        : selectedToday.length < slots ? [...selectedToday, id] : selectedToday
      return { date: today, ids }
    })
  }

  const confirm = () => {
    void setDailySoulLoadout(selected)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/95 p-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="soul-loadout-title"
        className="cv-panel max-h-[90vh] w-full max-w-md overflow-y-auto p-4"
      >
        <p className="font-pixel text-xs uppercase tracking-[0.2em] text-blood-300">Nuevo día operativo</p>
        <h2 id="soul-loadout-title" className="mt-2 font-heading text-2xl text-gold-300">
          Elige tus Almas
        </h2>
        <p className="mt-2 font-body text-sm text-silver-300">
          Este loadout quedará fijado hasta las 02:00. Podrás cambiarlo al entrar en el siguiente día.
        </p>
        <p className="mt-2 font-body text-sm text-gold-200">
          Casillas disponibles: {selected.length}/{slots}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {available.map((id) => {
            const definition = soulDefinition(id)
            const progress = profile?.souls?.[id]
            const active = selected.includes(id)
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(id)}
                className={`cv-plate text-left transition-colors ${active ? 'border-gold-400 bg-gold-950/40' : 'hover:border-gold-600/70'}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-pixel text-base text-gold-300">{definition.name}</span>
                  <span className="font-body text-xs text-silver-400">Rango {progress?.rank ?? 1}</span>
                </span>
                <span className="mt-1 block font-body text-xs text-silver-300">{definition.effectDescription}</span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={confirm}
          className="cv-btn cv-btn--gold mt-4 w-full"
        >
          {selected.length > 0 ? 'Fijar loadout del día' : 'Continuar sin Almas'}
        </button>
      </section>
    </div>
  )
}

export default SoulLoadoutModal
