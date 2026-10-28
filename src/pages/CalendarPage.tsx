import { addMonths, format, isSameDay, isSameMonth, parseISO, startOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CandleStack from '../components/CandleStack'
import DayDetail from '../components/DayDetail'
import PageHeader from '../components/PageHeader'
import SectionTitle from '../components/SectionTitle'
import { buildCandlesByDay, monthGridDays } from '../lib/calendar'
import { logicalNow } from '../lib/date'
import { yesterdayKey } from '../lib/dayCorrections'
import { useItemsStore } from '../store/useItemsStore'

const WEEKDAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function CalendarPage() {
  const items = useItemsStore((s) => s.items)
  const completionsByItem = useItemsStore((s) => s.completionsByItem)
  const [params, setParams] = useSearchParams()
  const requested = params.get('date')
  const parsed = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? parseISO(requested) : logicalNow()
  const selected = Number.isNaN(parsed.getTime()) ? logicalNow() : parsed
  const [month, setMonth] = useState(() => startOfMonth(selected))
  const selectDay = (day: Date) => setParams({ date: format(day, 'yyyy-MM-dd') }, { replace: true })

  const today = logicalNow()
  const days = monthGridDays(month)
  const candles = buildCandlesByDay(items, completionsByItem, days, today)

  return (
    <>
      <PageHeader title="Calendario" subtitle="Las velas marcan lo cumplido y lo que se avecina." />
      <section className="relative z-10 flex flex-col gap-3 px-3">
        <div className="flex gap-2">
          <button type="button" className="cv-btn px-3 py-1" onClick={() => { const day = parseISO(yesterdayKey()); selectDay(day); setMonth(startOfMonth(day)) }}>
            Corregir ayer
          </button>
          <button type="button" className="cv-btn px-3 py-1" onClick={() => { selectDay(today); setMonth(startOfMonth(today)) }}>
            Hoy
          </button>
        </div>
        <div className="cv-panel p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMonth((current) => subMonths(current, 1))}
              className="cv-btn px-3 py-1"
              aria-label="Mes anterior"
            >
              ◀
            </button>
            <h2 className="cv-shadow font-pixel text-2xl leading-none text-gold-300 capitalize">
              {format(month, 'MMMM yyyy', { locale: es })}
            </h2>
            <button
              type="button"
              onClick={() => setMonth((current) => addMonths(current, 1))}
              className="cv-btn px-3 py-1"
              aria-label="Mes siguiente"
            >
              ▶
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_HEADERS.map((label) => (
              <span key={label} className="cv-label">{label}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const entry = candles.get(key) ?? { lit: 0, unlit: 0 }
              const isSelected = isSameDay(day, selected)
              const isToday = isSameDay(day, today)
              const border = isToday ? 'border-gold-400' : 'border-silver-700/40'
              const background = isSelected ? 'bg-night-700' : 'bg-night-950/60'
              const dim = isSameMonth(day, month) ? '' : 'opacity-40'

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectDay(day)}
                  aria-pressed={isSelected}
                  aria-label={`${format(day, "d 'de' MMMM", { locale: es })}: ${entry.lit} cumplidas, ${entry.unlit} previstas`}
                  className={`flex aspect-square min-w-0 flex-col items-center justify-between gap-0.5 overflow-hidden border p-[2px] ${border} ${background} ${dim}`}
                >
                  <span className={`font-pixel text-base leading-none ${isToday ? 'text-gold-300' : 'text-silver-300'}`}>
                    {format(day, 'd')}
                  </span>
                  <CandleStack lit={entry.lit} unlit={entry.unlit} />
                </button>
              )
            })}
          </div>
        </div>

        <div className="cv-panel p-3">
          <SectionTitle>Detalle del día</SectionTitle>
          <DayDetail date={selected} />
        </div>
      </section>
    </>
  )
}

export default CalendarPage
