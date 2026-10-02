import { format, subDays } from 'date-fns'
import PageHeader from '../components/PageHeader'
import RelicsGrid from '../components/RelicsGrid'
import SectionTitle from '../components/SectionTitle'
import { buildDailyStats } from '../lib/stats'
import { useItemsStore } from '../store/useItemsStore'

function StatsPage() {
  const items = useItemsStore((s) => s.items)
  const completionsByItem = useItemsStore((s) => s.completionsByItem)
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
              const intensity = day.ratio === null ? 'bg-night-950' : day.ratio >= 0.8 ? 'bg-gold-400' : day.ratio >= 0.5 ? 'bg-gold-600' : 'bg-blood-700'
              return (
                <div
                  key={day.key}
                  title={`${format(new Date(`${day.key}T12:00:00`), 'dd/MM')}: ${day.completions} completadas`}
                  className={`aspect-square border border-silver-700/40 ${intensity}`}
                />
              )
            })}
          </div>
          <div className="mt-3 flex justify-between font-pixel text-sm text-silver-500">
            <span>{format(subDays(new Date(), 34), 'dd/MM')}</span>
            <span>Hoy</span>
          </div>
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