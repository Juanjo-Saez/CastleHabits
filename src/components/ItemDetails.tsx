import { format } from 'date-fns'
import { RRule } from 'rrule'
import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { todayKey } from '../lib/date'
import { DIFFICULTY_LABEL } from '../lib/gamification'
import { describeRecurrence } from '../lib/recurrence'
import { defaultRecurrenceDraft, isDraftValid, ruleFromDraft, type RecurrenceDraft } from '../lib/recurrenceDraft'
import { ROUTES } from '../lib/routes'
import { useItemsStore } from '../store/useItemsStore'
import type { Difficulty, Item, RouteId, TrackingType } from '../types'
import DifficultyPicker from './DifficultyPicker'
import RecurrencePicker from './RecurrencePicker'
import RoutePicker from './RoutePicker'
import ZonePicker from './ZonePicker'

function recurrenceDraftFor(item: Item): RecurrenceDraft {
  const startDate = item.startDate ?? item.createdAt.slice(0, 10)
  const draft = { ...defaultRecurrenceDraft(), startDate }
  if (!item.recurrenceRule) return draft

  try {
    const options = RRule.fromString(item.recurrenceRule).options
    let unit: RecurrenceDraft['unit'] = 'day'
    if (options.freq === RRule.WEEKLY) unit = 'week'
    if (options.freq === RRule.MONTHLY) unit = 'month'
    return {
      ...draft,
      unit,
      interval: options.interval,
      weekdays: options.byweekday ?? draft.weekdays,
      monthDay: options.bymonthday?.[0] ?? 1,
      lastDay: options.bynmonthday?.includes(-1) ?? false,
    }
  } catch {
    return draft
  }
}

function itemTypeLabel(type: Item['type']): string {
  switch (type) {
    case 'habit': return 'Misión secundaria'
    case 'chore': return 'Obligación recurrente'
    case 'todo': return 'Tarea puntual'
  }
}

function ItemDetails({ item, onClose }: Readonly<{ item: Item; onClose: () => void }>) {
  const updateItem = useItemsStore((s) => s.updateItem)
  const archiveItem = useItemsStore((s) => s.archiveItem)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [difficulty, setDifficulty] = useState<Difficulty>(item.difficulty)
  const [routeId, setRouteId] = useState<RouteId | undefined>(item.routeId)
  const [zone, setZone] = useState(item.zone ?? '')
  const [dueDate, setDueDate] = useState(item.dueDate ?? todayKey())
  const [recurrence, setRecurrence] = useState(() => recurrenceDraftFor(item))
  const [trackingType, setTrackingType] = useState<TrackingType>(item.trackingType)
  const [quantityGoal, setQuantityGoal] = useState(item.quantityGoal ?? 10)
  const [unit, setUnit] = useState(item.unit ?? '')
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const canSave = Boolean(title.trim()) &&
    (item.type !== 'todo' || Boolean(dueDate)) &&
    (item.type !== 'chore' || isDraftValid(recurrence, true)) &&
    (trackingType !== 'quantity' || quantityGoal > 0)

  const handleSave = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSave) return

    const changes: Partial<Omit<Item, 'id' | 'createdAt'>> = {
      title: title.trim(),
      difficulty,
      routeId: item.type === 'todo' ? undefined : routeId,
      trackingType,
      quantityGoal: trackingType === 'quantity' ? quantityGoal : undefined,
      unit: trackingType === 'quantity' ? unit.trim() || undefined : undefined,
    }
    if (item.type === 'chore') {
      changes.zone = zone.trim() || undefined
      changes.recurrenceRule = ruleFromDraft(recurrence)
      changes.startDate = recurrence.startDate
    }
    if (item.type === 'todo') changes.dueDate = dueDate

    await updateItem(item.id, changes)
    setEditing(false)
    onClose()
  }

  const handleDelete = async () => {
    await archiveItem(item.id)
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="item-details-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      className="m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-md border-0 bg-transparent p-0 backdrop:bg-black/75"
    >
      <section
        className="cv-panel max-h-[90dvh] overflow-y-auto p-4"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="cv-label">{itemTypeLabel(item.type)}</p>
            <h2 id="item-details-title" className="cv-shadow mt-1 break-words font-pixel text-2xl leading-tight text-gold-300">
              {editing ? 'Editar tarea' : item.title}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="cv-btn cv-btn--ghost shrink-0 px-2 py-1">
            Cerrar
          </button>
        </div>

        {editing ? (
          <form onSubmit={(event) => void handleSave(event)} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="cv-label">Nombre</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="cv-input" autoFocus />
            </label>

            {item.type === 'chore' && (
              <ZonePicker value={zone} onChange={setZone} />
            )}

            <div className="flex flex-col gap-1">
              <span className="cv-label">Dificultad</span>
              <DifficultyPicker value={difficulty} onChange={setDifficulty} />
            </div>

            {item.type !== 'todo' && <RoutePicker value={routeId} onChange={setRouteId} />}

            {item.type === 'chore' && (
              <RecurrencePicker value={recurrence} onChange={setRecurrence} allowPastStartDate />
            )}
            {item.type === 'todo' && (
              <label className="flex flex-col gap-1">
                <span className="cv-label">Vence</span>
                <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="cv-input" />
              </label>
            )}
            {item.type === 'habit' && (
              <div className="flex flex-col gap-1">
                <span className="cv-label">Registro</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTrackingType('boolean')}
                    className={`cv-btn ${trackingType === 'boolean' ? 'cv-btn--active' : ''}`}
                  >
                    Sí / No
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackingType('quantity')}
                    className={`cv-btn ${trackingType === 'quantity' ? 'cv-btn--active' : ''}`}
                  >
                    Cantidad
                  </button>
                </div>
              </div>
            )}

            {item.type === 'chore' && item.trackingType === 'quantity' && (
              <QuantityFields quantityGoal={quantityGoal} setQuantityGoal={setQuantityGoal} unit={unit} setUnit={setUnit} />
            )}
            {item.type === 'habit' && trackingType === 'quantity' && (
              <QuantityFields quantityGoal={quantityGoal} setQuantityGoal={setQuantityGoal} unit={unit} setUnit={setUnit} />
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditing(false)} className="cv-btn cv-btn--ghost">Cancelar</button>
              <button type="submit" disabled={!canSave} className="cv-btn cv-btn--gold disabled:opacity-50">Guardar</button>
            </div>
          </form>
        ) : (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 font-body text-base">
              <dt className="text-silver-500">Dificultad</dt>
              <dd className="text-silver-100">{DIFFICULTY_LABEL[item.difficulty]}</dd>
              {item.zone && <><dt className="text-silver-500">Estancia</dt><dd className="text-silver-100">{item.zone}</dd></>}
              {item.routeId && <><dt className="text-silver-500">Ruta</dt><dd className="text-silver-100">{ROUTES[item.routeId].name}</dd></>}
              {item.type === 'chore' && <><dt className="text-silver-500">Frecuencia</dt><dd className="text-silver-100">{describeRecurrence(item.recurrenceRule)}</dd></>}
              {item.type === 'todo' && item.dueDate && <><dt className="text-silver-500">Vence</dt><dd className="text-silver-100">{format(new Date(`${item.dueDate}T12:00:00`), 'dd/MM/yyyy')}</dd></>}
              {item.trackingType === 'quantity' && <><dt className="text-silver-500">Meta</dt><dd className="text-silver-100">{item.quantityGoal} {item.unit}</dd></>}
            </dl>

            {confirmDelete ? (
              <div className="mt-4 border border-blood-700/60 bg-blood-950/30 p-3" role="alertdialog" aria-label="Confirmar eliminación">
                <p className="font-body text-silver-100">Se quitará de tus listas. El historial y las recompensas anteriores se conservarán.</p>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setConfirmDelete(false)} className="cv-btn cv-btn--ghost">Cancelar</button>
                  <button type="button" onClick={() => void handleDelete()} className="cv-btn cv-btn--blood">Eliminar</button>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex justify-between gap-2">
                <button type="button" onClick={() => setConfirmDelete(true)} className="cv-btn cv-btn--ghost text-blood-400">Eliminar</button>
                <button type="button" onClick={() => setEditing(true)} className="cv-btn cv-btn--gold">Editar</button>
              </div>
            )}
          </>
        )}
      </section>
    </dialog>
  )
}

function QuantityFields({
  quantityGoal,
  setQuantityGoal,
  unit,
  setUnit,
}: Readonly<{
  quantityGoal: number
  setQuantityGoal: (value: number) => void
  unit: string
  setUnit: (value: string) => void
}>) {
  return (
    <div className="flex gap-2">
      <label className="flex w-24 flex-col gap-1">
        <span className="cv-label">Meta</span>
        <input type="number" min={1} value={quantityGoal} onChange={(event) => setQuantityGoal(Number(event.target.value))} className="cv-input" />
      </label>
      <label className="flex flex-1 flex-col gap-1">
        <span className="cv-label">Unidad</span>
        <input value={unit} onChange={(event) => setUnit(event.target.value)} className="cv-input" />
      </label>
    </div>
  )
}

export default ItemDetails