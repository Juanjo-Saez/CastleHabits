import { useEffect, useState } from 'react'
import { liveQuery } from 'dexie'
import { db } from '../db/database'
import { ROUTE_IDS, ROUTES } from '../lib/routes'
import {
  confirmLegacyExpedition,
  correctionCandidates,
  correctionItemsForDate,
  CorrectionDeathError,
  groupCorrectionCandidates,
  isCorrectionDay,
  type DayCorrection as CorrectionInput,
} from '../lib/dayCorrections'
import { activityDateKey } from '../lib/date'
import { completionInWindow } from '../lib/recurrence'
import { useItemsStore } from '../store/useItemsStore'
import { usePlayerStore } from '../store/usePlayerStore'
import type { Completion, Item, ItemEvent, RouteId } from '../types'

function CorrectionRow({
  item, date, history, failureEvents, disabled, onSave,
}: Readonly<{
  item: Item
  date: string
  history: Completion[]
  failureEvents?: ItemEvent[]
  disabled: boolean
  onSave: (input: CorrectionInput) => Promise<void>
}>) {
  const completion = completionInWindow(item, history, date)
  const initial = completion ? (item.trackingType === 'boolean' ? 1 : completion.quantityDone ?? 0) : 0
  const [quantity, setQuantity] = useState(String(initial))
  const otherDay = completion && completion.date !== date
  const goal = item.quantityGoal ?? 1
  const damage = failureEvents?.reduce((total, event) => total + (event.damage ?? 0), 0) ?? 0
  const protections = [...new Set(failureEvents?.map((event) => event.protectedBy).filter(Boolean))]

  return (
    <li className="border-t border-gold-600/20 py-2">
      <p className="break-words font-body text-base font-semibold text-silver-100">{item.title}</p>
      {failureEvents && (
        <p className="font-body text-xs text-blood-300">
          {damage > 0
            ? `Daño recibido: ${damage} vida`
            : `Sin daño · protegido por ${protections.map((protection) => protection === 'shield' ? 'escudo' : 'congelación').join(' y ')}`}
        </p>
      )}
      {otherDay ? (
        <p className="mt-1 font-body text-xs text-silver-400">
          Total de la aparición registrado el {completion.date}. Abre ese día para corregirlo; los registros anteriores a ayer están bloqueados.
        </p>
      ) : (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {item.trackingType === 'quantity' && (
            <label className="flex items-center gap-2 font-body text-sm text-silver-300">
              <span>Total de la aparición</span>
              <input
                type="number"
                min={0}
                max={goal}
                step={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={disabled}
                aria-label={`Cantidad de ${item.title}`}
                className="cv-input w-20"
              />
              <span>/ {goal} {item.unit}</span>
            </label>
          )}
          <button
            type="button"
            disabled={disabled}
            className="cv-btn px-2 py-1 disabled:opacity-50"
            onClick={() => void onSave({
              itemId: item.id,
              date,
              quantity: item.trackingType === 'boolean' ? (initial ? 0 : 1) : quantity.trim() === '' ? NaN : Number(quantity),
            })}
          >
            {item.trackingType === 'quantity' ? 'Guardar cantidad' : initial ? 'Desmarcar' : 'Marcar como hecho'}
          </button>
        </div>
      )}
    </li>
  )
}

function DayCorrection({ date }: Readonly<{ date: string }>) {
  const items = useItemsStore((state) => state.items)
  const history = useItemsStore((state) => state.completionsByItem)
  const correctDay = useItemsStore((state) => state.correctDay)
  const profile = usePlayerStore((state) => state.profile)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [missedEvents, setMissedEvents] = useState<ItemEvent[]>([])
  const [eventsLoaded, setEventsLoaded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [death, setDeath] = useState<{ input: CorrectionInput; damage: number } | null>(null)
  useEffect(() => {
    const subscription = liveQuery(() => db.itemEvents.where('kind').equals('missed').toArray()).subscribe({
      next: (events) => {
        setMissedEvents(events)
        setEventsLoaded(true)
        setEventsError(null)
      },
      error: (cause: unknown) => {
        setEventsLoaded(true)
        setEventsError(cause instanceof Error ? cause.message : 'No se pudieron leer los fallos.')
      },
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!isCorrectionDay(date) || !profile) return null
  if (profile.dead || profile.runStartedAt && activityDateKey(profile.runStartedAt) > date) {
    return <p className="font-body text-sm text-silver-500">Edición bloqueada: no se pueden modificar días de expediciones terminadas.</p>
  }

  const itemsForDate = correctionItemsForDate(items, profile, date)
  const candidates = correctionCandidates(itemsForDate, history, date)
  const groups = groupCorrectionCandidates(candidates, history, date, missedEvents, itemsForDate, profile.runStartedAt)
  const sideQuestsByRoute = new Map<RouteId | 'unassigned', Item[]>()
  for (const item of groups.sideQuests) {
    const routeId = item.routeId ?? 'unassigned'
    const routeItems = sideQuestsByRoute.get(routeId) ?? []
    routeItems.push(item)
    sideQuestsByRoute.set(routeId, routeItems)
  }
  const routeGroups = [
    ...ROUTE_IDS.filter((routeId) => sideQuestsByRoute.has(routeId)).map((routeId) => ({
      id: routeId,
      title: `${ROUTES[routeId].icon} ${ROUTES[routeId].name}`,
      items: (sideQuestsByRoute.get(routeId) ?? []).sort((left, right) =>
        left.title.localeCompare(right.title, 'es', { sensitivity: 'base' })),
    })),
    ...(sideQuestsByRoute.has('unassigned')
      ? [{
        id: 'unassigned' as const,
        title: 'Sin ruta',
        items: (sideQuestsByRoute.get('unassigned') ?? []).sort((left, right) =>
          left.title.localeCompare(right.title, 'es', { sensitivity: 'base' })),
      }]
      : []),
  ]

  const save = async (input: CorrectionInput, confirmedDamage?: number) => {
    setBusy(true)
    setError(null)
    setSaved(false)
    setDeath(null)
    try {
      await correctDay(input, confirmedDamage)
      setSaved(true)
    } catch (cause) {
      if (cause instanceof CorrectionDeathError) setDeath({ input, damage: cause.damage })
      else setError(cause instanceof Error ? cause.message : 'No se pudo guardar la corrección.')
    } finally {
      setBusy(false)
    }
  }
  const confirmLegacy = async () => {
    setBusy(true)
    setError(null)
    try {
      await confirmLegacyExpedition()
      await usePlayerStore.getState().load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo confirmar la expedición.')
    } finally {
      setBusy(false)
    }
  }

  const renderRows = (sectionItems: Item[]) => (
    <ul className="flex flex-col">
      {sectionItems.map((item) => {
        const itemHistory = history[item.id] ?? []
        const completion = completionInWindow(item, itemHistory, date)
        return (
          <CorrectionRow
            key={`${item.id}:${completion?.id ?? ''}:${completion?.quantityDone ?? ''}`}
            item={item}
            date={date}
            history={itemHistory}
            failureEvents={groups.failureEvents[item.id]}
            disabled={busy || death !== null}
            onSave={save}
          />
        )
      })}
    </ul>
  )

  return (
    <div className="mt-2 flex flex-col gap-2">
      <button type="button" className="cv-btn cv-btn--gold px-2 py-1" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? 'Cerrar corrección' : 'Corregir este día'}
      </button>
      {open && (
        <>
          <p className="font-body text-sm text-silver-400">
            Registra solo lo que hiciste este día. Se ajustarán recompensas, daño, defensas, rachas y rutas. Los niveles del personaje ya alcanzados se conservan.
          </p>
          {!profile.runStartedAt ? (
            <div className="cv-panel p-2">
              <p className="font-body text-sm text-silver-300">
                Este perfil antiguo no guarda el inicio de la expedición. Confirma solo si hoy y ayer pertenecen al personaje actual. Si empezaste hoy, espera a mañana para habilitar las correcciones sin tocar la expedición anterior.
              </p>
              <button type="button" disabled={busy} className="cv-btn mt-2 px-2 py-1" onClick={() => void confirmLegacy()}>
                Confirmar que hoy y ayer son de esta expedición
              </button>
            </div>
          ) : candidates.length === 0 ? (
            <p className="font-body text-sm text-silver-500">No hay actividades disponibles para corregir este día.</p>
          ) : !eventsLoaded ? (
            <p role="status" className="font-body text-sm text-silver-400">Cargando fallos del día…</p>
          ) : eventsError ? (
            <p role="alert" className="font-body text-sm text-blood-400">No se puede ordenar la lista de corrección: {eventsError}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {groups.failed.length > 0 && (
                <section>
                  <h3 className="cv-label">Falladas ({groups.failed.length})</h3>
                  <p className="font-body text-xs text-silver-500">Daño recibido o absorbido por una defensa.</p>
                  {renderRows(groups.failed)}
                </section>
              )}
              {groups.registered.length > 0 && (
                <section>
                  <h3 className="cv-label">Ya registradas ({groups.registered.length})</h3>
                  {renderRows(groups.registered)}
                </section>
              )}
              {groups.pending.length > 0 && (
                <section>
                  <h3 className="cv-label">Pendientes o con margen ({groups.pending.length})</h3>
                  {renderRows(groups.pending)}
                </section>
              )}
              {routeGroups.length > 0 && (
                <section>
                  <h3 className="cv-label">Misiones secundarias ({groups.sideQuests.length})</h3>
                  <div className="mt-1 flex flex-col gap-2">
                    {routeGroups.map((route) => (
                      <details key={route.id} className="cv-panel p-2">
                        <summary className="cursor-pointer font-body text-sm font-semibold text-gold-300">
                          {route.title} <span className="text-silver-500">· {route.items.length}</span>
                        </summary>
                        <div className="mt-1">{renderRows(route.items)}</div>
                      </details>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
          {busy && <p role="status" className="font-body text-sm text-silver-400">Guardando…</p>}
          {saved && <p role="status" className="font-body text-sm text-gold-300">Corrección guardada.</p>}
          {error && <p role="alert" className="font-body text-sm text-blood-400">{error}</p>}
          {death && (
            <div role="alert" className="cv-panel cv-panel--blood p-3">
              <p className="font-body text-sm text-blood-400">
                Esta corrección causa {death.damage} de daño adicional y mata al personaje. La muerte es irreversible.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="cv-btn px-2 py-1" onClick={() => setDeath(null)}>Cancelar</button>
                <button type="button" className="cv-btn px-2 py-1" onClick={() => void save(death.input, death.damage)}>Confirmar corrección y muerte</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DayCorrection
