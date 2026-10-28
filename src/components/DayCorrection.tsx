import { useState } from 'react'
import {
  confirmLegacyExpedition,
  correctionCandidates,
  correctionItemsForDate,
  CorrectionDeathError,
  isCorrectionDay,
  type DayCorrection as CorrectionInput,
} from '../lib/dayCorrections'
import { activityDateKey } from '../lib/date'
import { completionInWindow } from '../lib/recurrence'
import { useItemsStore } from '../store/useItemsStore'
import { usePlayerStore } from '../store/usePlayerStore'
import type { Completion, Item } from '../types'

function CorrectionRow({
  item, date, history, disabled, onSave,
}: Readonly<{
  item: Item
  date: string
  history: Completion[]
  disabled: boolean
  onSave: (input: CorrectionInput) => Promise<void>
}>) {
  const completion = completionInWindow(item, history, date)
  const initial = completion ? (item.trackingType === 'boolean' ? 1 : completion.quantityDone ?? 0) : 0
  const [quantity, setQuantity] = useState(String(initial))
  const otherDay = completion && completion.date !== date
  const goal = item.quantityGoal ?? 1

  return (
    <li className="border-t border-gold-600/20 pt-2">
      <p className="break-words font-pixel text-xl text-silver-100">{item.title}</p>
      {otherDay ? (
        <p className="font-body text-sm text-silver-400">
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
  const [saved, setSaved] = useState(false)
  const [death, setDeath] = useState<{ input: CorrectionInput; damage: number } | null>(null)
  if (!isCorrectionDay(date) || !profile) return null
  if (profile.dead || profile.runStartedAt && activityDateKey(profile.runStartedAt) > date) {
    return <p className="font-body text-sm text-silver-500">Edición bloqueada: no se pueden modificar días de expediciones terminadas.</p>
  }

  const candidates = correctionCandidates(correctionItemsForDate(items, profile, date), history, date)
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
          ) : (
            <ul className="flex flex-col gap-2">
              {candidates.map((item) => {
                const itemHistory = history[item.id] ?? []
                const completion = completionInWindow(item, itemHistory, date)
                return (
                  <CorrectionRow
                    key={`${item.id}:${completion?.id ?? ''}:${completion?.quantityDone ?? ''}`}
                    item={item}
                    date={date}
                    history={itemHistory}
                    disabled={busy || death !== null}
                    onSave={save}
                  />
                )
              })}
            </ul>
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
