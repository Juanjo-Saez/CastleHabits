import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { useState } from 'react'
import { RRule } from 'rrule'
import PageHeader from '../components/PageHeader'
import SectionTitle from '../components/SectionTitle'
import { todayKey } from '../lib/date'
import { describeRecurrence } from '../lib/recurrence'
import { ROUTES } from '../lib/routes'
import { computeBestStreak, computeStreak } from '../lib/streak'
import { useItemsStore } from '../store/useItemsStore'
import type { Item } from '../types'

type Frequency = 'all' | 'daily' | 'weekly' | 'monthly' | 'once' | 'other'

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'daily', label: 'Diarias' },
  { value: 'weekly', label: 'Semanales' },
  { value: 'monthly', label: 'Mensuales' },
  { value: 'once', label: 'Puntuales' },
  { value: 'other', label: 'Otras' },
]

const ITEM_TYPE_LABELS: Record<Item['type'], string> = {
  habit: 'Hábito',
  chore: 'Tarea del hogar',
  todo: 'Tarea puntual',
}

const DIFFICULTY_LABELS: Record<Item['difficulty'], string> = {
  trivial: 'Trivial',
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
}

function getFrequency(item: Item): Exclude<Frequency, 'all'> {
  if (!item.recurrenceRule) return item.type === 'todo' ? 'once' : 'daily'

  try {
    switch (RRule.fromString(item.recurrenceRule).options.freq) {
      case RRule.DAILY:
        return 'daily'
      case RRule.WEEKLY:
        return 'weekly'
      case RRule.MONTHLY:
        return 'monthly'
      default:
        return 'other'
    }
  } catch {
    return 'other'
  }
}

function getFrequencyLabel(item: Item): string {
  if (item.recurrenceRule) {
    return describeRecurrence(item.recurrenceRule) || 'Recurrencia no reconocida'
  }
  return item.type === 'todo' ? 'Una vez' : 'Cada día'
}

function getNextDate(item: Item, completedCount: number): string | null {
  if (item.archived) return null
  const today = todayKey()
  if (item.type === 'todo') {
    return completedCount === 0 && item.dueDate && item.dueDate >= today ? item.dueDate : null
  }

  const startDate = [today, item.startDate, item.createdAt.slice(0, 10)]
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1)!
  if (!item.recurrenceRule) return startDate

  try {
    const next = RRule.fromString(item.recurrenceRule).after(parseISO(startDate), true)
    return next ? format(next, 'yyyy-MM-dd') : null
  } catch {
    return null
  }
}

function formatDate(date: string): string {
  return format(parseISO(date), 'd MMM yyyy', { locale: es })
}

function TaskArchivePage() {
  const items = useItemsStore((state) => state.items)
  const completionsByItem = useItemsStore((state) => state.completionsByItem)
  const loading = useItemsStore((state) => state.loading)
  const [frequency, setFrequency] = useState<Frequency>('all')
  const [hideRouteMissions, setHideRouteMissions] = useState(true)

  const sortedItems = [...items].sort((first, second) => {
    if (first.archived !== second.archived) return first.archived ? 1 : -1
    return first.title.localeCompare(second.title, 'es')
  })
  const frequencyItems = frequency === 'all'
    ? sortedItems
    : sortedItems.filter((item) => getFrequency(item) === frequency)
  const visibleItems = hideRouteMissions
    ? frequencyItems.filter((item) => !item.routeId)
    : frequencyItems

  return (
    <>
      <PageHeader title="Archivo de Tareas" subtitle="Cada compromiso, su ritmo y todo lo que ya cumpliste." />
      <section className="relative z-10 flex flex-col gap-3 px-3 pb-4">
        <div className="flex items-end gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="cv-label">Frecuencia</span>
            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as Frequency)}
              className="w-full border border-gold-600/40 bg-crypt-900 px-3 py-2 font-body text-base text-parchment-100"
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 font-body text-sm text-parchment-100">
            <input
              type="checkbox"
              checked={hideRouteMissions}
              onChange={(event) => setHideRouteMissions(event.target.checked)}
              className="accent-gold-400"
            />
            Ocultar misiones de ruta
          </label>
          <p className="cv-label shrink-0" aria-live="polite">
            {visibleItems.length} / {items.length}
          </p>
        </div>

        {loading ? (
          <div className="cv-panel p-4 text-center">
            <p className="font-body text-silver-400">Consultando el archivo...</p>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="cv-panel p-4 text-center">
            <SectionTitle>{items.length === 0 ? 'El archivo está vacío' : 'Sin tareas en este filtro'}</SectionTitle>
            <p className="mt-2 font-body text-silver-400">
              {items.length === 0
                ? 'Cuando añadas tareas, sus frecuencias y registros aparecerán aquí.'
                : hideRouteMissions && frequencyItems.some((item) => item.routeId)
                  ? 'No hay tareas propias en este filtro. Puedes mostrar también las misiones vinculadas a rutas.'
                  : 'Prueba con otra frecuencia para ver más tareas.'}
            </p>
          </div>
        ) : visibleItems.map((item) => {
          const completions = [...(completionsByItem[item.id] ?? [])]
            .sort((first, second) => second.date.localeCompare(first.date))
          const nextDate = getNextDate(item, completions.length)
          const frequencyLabel = getFrequencyLabel(item)
          const bestStreak = computeBestStreak(item, completions)
          const currentStreak = item.archived ? 0 : computeStreak(item, completions)

          return (
            <article key={item.id} className="cv-panel p-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none" aria-hidden="true">
                  {item.icon || (item.type === 'habit' ? '🕯️' : item.type === 'chore' ? '🏰' : '📜')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 className="cv-shadow font-heading text-lg leading-tight text-parchment-100">{item.title}</h2>
                    {item.archived && (
                      <span className="border border-silver-600/40 px-1.5 py-0.5 font-pixel text-[10px] text-silver-400">
                        Archivada
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-body text-sm text-gold-300">{frequencyLabel}</p>
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-gold-600/20 pt-3 font-body text-sm">
                <dt className="text-silver-500">Tipo</dt>
                <dd className="text-right text-parchment-100">{ITEM_TYPE_LABELS[item.type]}</dd>
                <dt className="text-silver-500">Dificultad</dt>
                <dd className="text-right text-parchment-100">{DIFFICULTY_LABELS[item.difficulty]}</dd>
                <dt className="text-silver-500">Compromiso</dt>
                <dd className="text-right text-parchment-100">
                  {item.commitment === 'sideQuest' ? 'Misión secundaria' : 'Obligación'}
                </dd>
                <dt className="text-silver-500">Seguimiento</dt>
                <dd className="text-right text-parchment-100">
                  {item.trackingType === 'quantity' ? 'Cantidad' : 'Sí / No'}
                </dd>
                {item.type !== 'todo' && (
                  <>
                    <dt className="text-silver-500">Racha</dt>
                    <dd className="text-right text-parchment-100">
                      {item.archived
                        ? `Mejor: ${bestStreak} ${bestStreak === 1 ? 'aparición' : 'apariciones'}`
                        : `${currentStreak} actual · ${bestStreak} mejor`}
                    </dd>
                  </>
                )}
                {item.routeId && (
                  <>
                    <dt className="text-silver-500">Ruta</dt>
                    <dd className="text-right text-parchment-100">{ROUTES[item.routeId].name}</dd>
                  </>
                )}
                {item.zone && (
                  <>
                    <dt className="text-silver-500">Zona</dt>
                    <dd className="text-right text-parchment-100">{item.zone}</dd>
                  </>
                )}
                {item.trackingType === 'quantity' && (
                  <>
                    <dt className="text-silver-500">Meta</dt>
                    <dd className="text-right text-parchment-100">
                      {item.quantityGoal} {item.unit}
                    </dd>
                  </>
                )}
                {item.type === 'todo' && item.dueDate && (
                  <>
                    <dt className="text-silver-500">Fecha límite</dt>
                    <dd className="text-right text-parchment-100">{formatDate(item.dueDate)}</dd>
                  </>
                )}
                {item.startDate && (
                  <>
                    <dt className="text-silver-500">Inicio</dt>
                    <dd className="text-right text-parchment-100">{formatDate(item.startDate)}</dd>
                  </>
                )}
                {nextDate && (
                  <>
                    <dt className="text-silver-500">Próxima fecha</dt>
                    <dd className="text-right text-parchment-100">{formatDate(nextDate)}</dd>
                  </>
                )}
                <dt className="text-silver-500">Añadida</dt>
                <dd className="text-right text-parchment-100">{formatDate(item.createdAt.slice(0, 10))}</dd>
              </dl>

              <div className="mt-3 border-t border-gold-600/20 pt-3">
                <p className="font-body text-sm text-parchment-100">
                  {completions.length === 0
                    ? 'Sin registros de actividad'
                    : `${completions.length} ${item.trackingType === 'quantity' ? (completions.length === 1 ? 'día registrado' : 'días registrados') : (completions.length === 1 ? 'completado' : 'completados')} · última vez ${formatDate(completions[0].date)}`}
                </p>
                {completions.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-body text-sm text-gold-300 underline decoration-gold-600/40 underline-offset-4">
                      Ver {item.trackingType === 'quantity' ? 'todos los registros' : 'todas las fechas'}
                    </summary>
                    <ul className="mt-2 flex flex-col gap-1.5 pl-1">
                      {completions.map((completion) => (
                        <li key={completion.id} className="flex justify-between gap-3 font-body text-sm text-silver-300">
                          <time dateTime={completion.date}>{formatDate(completion.date)}</time>
                          {item.trackingType === 'quantity' && (
                            <span>{completion.quantityDone ?? 0} {item.unit}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </article>
          )
        })}
      </section>
    </>
  )
}

export default TaskArchivePage