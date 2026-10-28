import { useState } from 'react'
import { Link } from 'react-router-dom'
import { yesterdayKey } from '../lib/dayCorrections'
import { recentMisses } from '../lib/streak'
import { useItemsStore } from '../store/useItemsStore'
import SectionTitle from './SectionTitle'

/** Fallos de ayer en obligaciones, desplegables como los recordatorios. */
function RecentMissesPanel() {
  const items = useItemsStore((s) => s.items)
  const completionsByItem = useItemsStore((s) => s.completionsByItem)
  const [open, setOpen] = useState(false)
  const misses = recentMisses(items, completionsByItem)

  return (
    <>
      <SectionTitle
        action={
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((visible) => !visible)}
            className="cv-btn px-2 py-1 text-base"
          >
            {open ? 'Ocultar' : `Ver (${misses.length})`}
          </button>
        }
      >
        Recientes
      </SectionTitle>

      {open && (
        <div className="cv-panel flex flex-col gap-3 p-3">
          <Link to={`/calendario?date=${yesterdayKey()}`} className="cv-btn px-2 py-1 text-center">
            ¿Olvidaste apuntarlo? Corregir ayer
          </Link>
          {misses.length === 0 ? (
            <p className="py-2 text-center font-pixel text-lg text-silver-700">
              — SIN FALLOS DE AYER —
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {misses.map(({ item, dateKey }) => (
                <li key={`${item.id}-${dateKey}`} className="font-pixel text-xl text-silver-100">
                  {item.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}

export default RecentMissesPanel
