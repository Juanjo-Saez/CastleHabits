import { format, parseISO, subDays } from 'date-fns'
import { useState } from 'react'
import DayDetail from '../components/DayDetail'
import PageHeader from '../components/PageHeader'
import RelicsGrid from '../components/RelicsGrid'
import SectionTitle from '../components/SectionTitle'
import { buildDailyStats } from '../lib/stats'
import { useItemsStore } from '../store/useItemsStore'

function intensityClass(ratio: number | null): string {
  if (ratio === null) return 'bg-night-950'
  if (ratio >= 0.8) return 'bg-gold-400'
  if (ratio >= 0.5) return 'bg-gold-600'
  return 'bg-blood-700'
}

function StatsPage() {
  const items = useItemsStore((s) => s.items)
  const completionsByItem = useItemsStore((s) => s.completionsByItem)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const stats = buildDailyStats(items, completionsByItem, 35)
  const activeDays = stats.filter((day) => day.ratio !== null)
  const completed = stats.reduce((sum, day) => sum + day.completions, 0)
  const average = activeDays.length
    ? Math.round((activeDays.reduce((sum, day) => sum + (day.ratio ?? 0), 0) / activeDays.length) * 100)
    : 0

  return (
    <>
      <PageHeader title="Crónicas" subtitle="El rastro de tus victorias recientes." />
      <section className="relative z-10 flex flex-col gap-4 px-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="cv-panel p-3 text-center">
            <p className="cv-label">Completadas</p>
            <p className="mt-1 font-pixel text-4xl text-gold-300">{completed}</p>
            <p className="font-body text-sm text-silver-500 italic">últimos 35 días</p>
          </div>
          <div className="cv-panel p-3 text-center">
            <p className="cv-label">Rendimiento</p>
            <p className="mt-1 font-pixel text-4xl text-gold-300">{average}%</p>
            <p className="font-body text-sm text-silver-500 italic">días con tareas</p>
          </div>
        </div>

        <div className="cv-panel p-3">
          <SectionTitle>Mapa de constancia</SectionTitle>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {stats.map((day) => {
              const label = `${format(parseISO(day.key), 'dd/MM')}: ${day.completions} completadas`
              const border = selectedDay === day.key ? 'border-silver-100' : 'border-silver-700/40'
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDay((current) => (current === day.key ? null : day.key))}
                  aria-pressed={selectedDay === day.key}
                  aria-label={label}
                  title={label}
                  className={`aspect-square border ${border} ${intensityClass(day.ratio)}`}
                />
              )
            })}
          </div>
          <div className="mt-3 flex justify-between font-pixel text-sm text-silver-500">
            <span>{format(subDays(new Date(), 34), 'dd/MM')}</span>
            <span>Hoy</span>
          </div>
          {selectedDay && (
            <div className="mt-3 border-t border-gold-600/30 pt-3">
              <DayDetail date={parseISO(selectedDay)} />
            </div>
          )}
        </div>

        <div className="cv-panel p-3">
          <SectionTitle>Reliquias</SectionTitle>
          <div className="mt-3"><RelicsGrid /></div>
        </div>
      </section>
    </>
  )
}

export default StatsPage