import { format, parseISO, subDays } from 'date-fns'
import { liveQuery } from 'dexie'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import DayDetail from '../components/DayDetail'
import PageHeader from '../components/PageHeader'
import RelicsGrid from '../components/RelicsGrid'
import AchievementsGrid from '../components/AchievementsGrid'
import SectionTitle from '../components/SectionTitle'
import { db } from '../db/database'
import { buildDailyStats, type DayStatus } from '../lib/stats'
import { logicalNow } from '../lib/date'
import { historicalStatsVisible } from '../lib/modifiers'
import { hasRelic } from '../lib/relics'
import { usePlayerStore } from '../store/usePlayerStore'
import { useDailySummaryStore } from '../store/useDailySummaryStore'
import { useItemsStore } from '../store/useItemsStore'
import type { ItemEvent } from '../types'

const STATUS_CLASS: Record<DayStatus, string> = {
  empty: 'bg-night-950',
  complete: 'bg-gold-400',
  partial: 'bg-silver-700',
  protected: 'bg-night-400',
  damaged: 'bg-blood-500',
}

function StatsPage() {
  const items = useItemsStore((s) => s.items)
  const completionsByItem = useItemsStore((s) => s.completionsByItem)
  const profile = usePlayerStore((s) => s.profile)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [missedEvents, setMissedEvents] = useState<ItemEvent[]>([])
  const [eventsError, setEventsError] = useState<string | null>(null)

  useEffect(() => {
    const subscription = liveQuery(() => db.itemEvents.where('kind').equals('missed').toArray()).subscribe({
      next: (events) => {
        setMissedEvents(events)
        setEventsError(null)
      },
      error: (cause: unknown) => setEventsError(cause instanceof Error ? cause.message : 'No se pudieron leer los fallos.'),
    })
    return () => subscription.unsubscribe()
  }, [])

  const stats = buildDailyStats(items, completionsByItem, 35, missedEvents)
  const selectedStat = stats.find((day) => day.key === selectedDay)
  const activeDays = stats.filter((day) => day.ratio !== null)
  const completed = stats.reduce((sum, day) => sum + day.completions, 0)
  const average = activeDays.length
    ? Math.round((activeDays.reduce((sum, day) => sum + (day.ratio ?? 0), 0) / activeDays.length) * 100)
    : 0
  const historyVisible = historicalStatsVisible(profile?.curses, profile?.relics)
  const hasAmnesia = profile?.curses?.some((curse) => curse.id === 'amnesia') ?? false
  const historyHint = hasAmnesia && hasRelic(profile?.relics, 'silverMirror')
    ? 'Cura la maldición para volver a verlas.'
    : hasAmnesia
      ? 'Consigue un Espejo de plata y cura la maldición para revelarlas.'
      : 'Consigue un Espejo de plata para revelarlas.'

  return (
    <>
      <PageHeader title="Crónicas" subtitle="El rastro de tus victorias recientes." />
      <section className="relative z-10 flex flex-col gap-4 px-3">
        {eventsError && <p role="alert" className="font-body text-sm text-blood-400">{eventsError}</p>}
        {!historyVisible && (
          <div className="cv-panel cv-panel--blood p-3">
            <SectionTitle>{hasAmnesia ? 'Amnesia' : 'Estadísticas bloqueadas'}</SectionTitle>
            <p className="mt-1 font-body text-sm text-silver-300">
              Las estadísticas históricas están ocultas. {historyHint}
            </p>
          </div>
        )}
        {historyVisible && (
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
        )}

        {historyVisible && <button
          type="button"
          onClick={() => void useDailySummaryStore.getState().openManual()}
          className="cv-panel flex items-center justify-between gap-3 p-3 text-left transition-colors hover:border-gold-400/60"
        >
          <div>
            <SectionTitle>Resumen de ayer</SectionTitle>
            <p className="mt-1 font-body text-sm text-silver-500 italic">
              Revive la crónica del día que acaba de cerrarse.
            </p>
          </div>
          <span aria-hidden="true" className="font-pixel text-xl text-gold-300">›</span>
        </button>}

        {historyVisible && (
          <div className="cv-panel p-3">
            <SectionTitle>Mapa de constancia</SectionTitle>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {stats.map((day) => {
                const date = format(parseISO(day.key), 'dd/MM')
                const label = day.due > 0 ? `${date}: ${day.obligationsDone} de ${day.due} obligaciones` : `${date}: sin obligaciones`
                const border = selectedDay === day.key ? 'border-silver-100' : 'border-silver-700/40'
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDay((current) => (current === day.key ? null : day.key))}
                    aria-pressed={selectedDay === day.key}
                    aria-label={label}
                    className={`aspect-square border ${border} ${STATUS_CLASS[day.status]}`}
                  />
                )
              })}
            </div>
            <div className="mt-3 flex justify-between font-pixel text-sm text-silver-500">
              <span>{format(subDays(logicalNow(), 34), 'dd/MM')}</span>
              <span>Hoy</span>
            </div>
            {selectedDay && (
              <div className="mt-3 border-t border-gold-600/30 pt-3">
                {selectedStat && (
                  <p className="mb-2 font-pixel text-lg text-silver-300">
                    {selectedStat.due > 0
                      ? `${selectedStat.obligationsDone} de ${selectedStat.due} obligaciones cumplidas`
                      : 'Sin obligaciones este día'}
                  </p>
                )}
                <DayDetail date={parseISO(selectedDay)} />
              </div>
            )}
          </div>
        )}

        {historyVisible && <Link to="/archivo" className="cv-panel flex items-center justify-between gap-3 p-3 transition-colors hover:border-gold-400/60">
          <div>
            <SectionTitle>Archivo de tareas</SectionTitle>
            <p className="mt-1 font-body text-sm text-silver-500 italic">
              Consulta tus tareas, frecuencias y registros.
            </p>
          </div>
          <span aria-hidden="true" className="font-pixel text-xl text-gold-300">›</span>
        </Link>}

        {historyVisible && <Link to="/historial" className="cv-panel flex items-center justify-between gap-3 p-3 transition-colors hover:border-gold-400/60">
          <div>
            <SectionTitle>Histórico de fallos</SectionTitle>
            <p className="mt-1 font-body text-sm text-silver-500 italic">
              Todas las obligaciones que no llegaron a cumplirse.
            </p>
          </div>
          <span aria-hidden="true" className="font-pixel text-xl text-gold-300">›</span>
        </Link>}

        <div className="cv-panel p-3">
          <SectionTitle>Reliquias</SectionTitle>
          <div className="mt-3"><RelicsGrid /></div>
        </div>
        <div className="cv-panel p-3">
          <SectionTitle>Logros</SectionTitle>
          <div className="mt-3"><AchievementsGrid /></div>
        </div>
      </section>
    </>
  )
}

export default StatsPage