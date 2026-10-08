import { format, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { buildDaySummary } from '../lib/calendar'
import { useItemsStore } from '../store/useItemsStore'

/** Detalle de un día: qué se cumplió, lo ganado y lo que queda o quedó pendiente. */
function DayDetail({ date }: Readonly<{ date: Date }>) {
  const items = useItemsStore((s) => s.items)
  const completionsByItem = useItemsStore((s) => s.completionsByItem)
  const summary = buildDaySummary(items, completionsByItem, date)
  const isPast = startOfDay(date) < startOfDay(new Date())
  const isEmpty = summary.done.length === 0 && summary.open.length === 0

  return (
    <div className="flex flex-col gap-2">
      <p className="cv-shadow font-pixel text-xl leading-none text-gold-300 capitalize">
        {format(date, "EEEE d 'de' MMMM", { locale: es })}
      </p>

      {isEmpty && (
        <p className="font-body text-sm text-silver-500 italic">Nada registrado ni previsto este día.</p>
      )}

      {summary.done.length > 0 && (
        <div>
          <p className="cv-label mb-1">Cumplidas</p>
          <ul className="flex flex-col gap-1">
            {summary.done.map((entry) => (
              <li key={entry.id} className="flex items-baseline justify-between gap-2 font-body text-silver-100">
                <span className="min-w-0 truncate">
                  {entry.title}
                  {entry.quantityDone !== undefined && (
                    <span className="text-silver-500"> · {entry.quantityDone} {entry.unit}</span>
                  )}
                </span>
                <span className="shrink-0 font-pixel text-base text-gold-300">
                  +{entry.xp} EXP · +{entry.coins} oro
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-right font-pixel text-lg text-gold-400">
            Total: {summary.xp} EXP · {summary.coins} oro
          </p>
        </div>
      )}

      {summary.open.length > 0 && (
        <div>
          <p className="cv-label mb-1">{isPast ? 'Sin cumplir' : 'Previstas'}</p>
          <ul className="flex flex-col gap-1">
            {summary.open.map((item) => (
              <li key={item.id} className={`font-body ${isPast ? 'text-blood-400' : 'text-silver-300'}`}>
                {item.title}
                {item.zone && <span className="text-silver-500"> · {item.zone}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default DayDetail
