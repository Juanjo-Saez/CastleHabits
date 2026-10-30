import { differenceInCalendarDays, parseISO } from 'date-fns'
import { activeCursesOn, CURSES } from '../lib/curses'
import { todayKey } from '../lib/date'
import { usePlayerStore } from '../store/usePlayerStore'

/** Chips compactos con las maldiciones en curso; no se muestra nada si no hay ninguna. */
function CurseBadges() {
  const curses = usePlayerStore((s) => s.profile?.curses)
  const today = todayKey()
  const active = activeCursesOn(curses, today)
  if (active.length === 0) return null
  return (
    <ul className="flex flex-wrap justify-center gap-2" aria-label="Maldiciones en curso">
      {active.map((curse) => {
        const left = Math.max(1, differenceInCalendarDays(parseISO(curse.expiresOn), parseISO(today)))
        return (
          <li key={curse.id} className="cv-tag cv-tag--blood cv-tag--still" title={CURSES[curse.id].description}>
            ☠ {CURSES[curse.id].name} · {left} {left === 1 ? 'día' : 'días'}
          </li>
        )
      })}
    </ul>
  )
}

export default CurseBadges
