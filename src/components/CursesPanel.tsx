import { differenceInCalendarDays, parseISO } from 'date-fns'
import { useState } from 'react'
import { activeCursesOn, CURSES, cureCost } from '../lib/curses'
import { todayKey } from '../lib/date'
import { usePlayerStore } from '../store/usePlayerStore'
import type { CurseId } from '../types'
import SectionTitle from './SectionTitle'

/** Maldiciones en curso y sus curas: agua bendita o la sacerdotisa. Solo aparece si hay algo que mostrar. */
function CursesPanel() {
  const profile = usePlayerStore((s) => s.profile)
  const cureCurse = usePlayerStore((s) => s.cureCurse)
  const [message, setMessage] = useState<string | null>(null)
  if (!profile) return null

  const today = todayKey()
  const curses = activeCursesOn(profile.curses, today)
  const holyWater = profile.holyWater ?? 0
  if (curses.length === 0 && holyWater === 0) return null
  const cost = cureCost(profile.level)

  const cure = async (id: CurseId, method: 'holyWater' | 'priest') => {
    const ok = await cureCurse(id, method)
    setMessage(ok ? `${CURSES[id].name} se disipa.` : 'No se pudo curar la maldición.')
  }

  return (
    <div className="cv-panel cv-panel--blood p-3">
      <SectionTitle>Maldiciones</SectionTitle>
      <p className="mt-1 font-body text-sm text-silver-500 italic">
        Agua bendita: {holyWater}. Las maldiciones leves caducan solas; las graves requieren cura o penitencia.
      </p>
      {curses.length === 0 ? (
        <p className="mt-2 font-body text-silver-300">Ninguna maldición te aflige.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {curses.map((curse) => {
            const definition = CURSES[curse.id]
            const grave = definition.severity === 'grave'
            const left = Math.max(1, differenceInCalendarDays(parseISO(curse.expiresOn), parseISO(today)))
            const penance = profile.penanceProgress?.[curse.id] ?? 0
            return (
              <li key={curse.id} className="cv-plate p-2">
                <p className="cv-shadow font-pixel text-xl leading-none text-blood-400">{definition.name}</p>
                <p className="mt-1 font-body text-sm text-silver-300">
                  {definition.description} {grave || curse.permanent
                    ? `Penitencia: ${penance}/3 días.`
                    : `Caduca en ${left} ${left === 1 ? 'día' : 'días'}.`}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    disabled={holyWater <= 0}
                    onClick={() => void cure(curse.id, 'holyWater')}
                    className="cv-btn cv-btn--gold flex-1 px-1 py-1 text-sm"
                  >
                    Agua bendita
                  </button>
                  <button
                    type="button"
                    disabled={profile.coins < cost}
                    onClick={() => void cure(curse.id, 'priest')}
                    className="cv-btn flex-1 px-1 py-1 text-sm"
                  >
                    Sacerdotisa · {cost}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {message && <p role="status" className="mt-2 font-body text-sm text-gold-300">{message}</p>}
    </div>
  )
}

export default CursesPanel
