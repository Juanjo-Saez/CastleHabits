import { format, parseISO, startOfDay, subDays } from 'date-fns'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { activeEncounter, bossCountsFor } from '../lib/bosses'
import { describeDaysLeft, logicalNow, todayKey } from '../lib/date'
import { DIFFICULTY_COINS, DIFFICULTY_XP } from '../lib/gamification'
import {
  completionInWindow,
  describeRecurrence,
  describeWindow,
  isItemDueOn,
  isObligation,
  isWindowClosingOn,
  isWindowCompleted,
  marginDaysOf,
  missedCarryOf,
} from '../lib/recurrence'
import { xpWithBonus } from '../lib/routes'
import { playWhip } from '../lib/sound'
import { computeMissStreak, computeStreak } from '../lib/streak'
import { useBossStore, xpAfterBoss } from '../store/useBossStore'
import { useItemsStore } from '../store/useItemsStore'
import { usePlayerStore } from '../store/usePlayerStore'
import type { Item } from '../types'
import Candle from './Candle'
import Skulls from './Skulls'

interface RewardPopup {
  id: number
  xp: number
  coins: number
}

function isDueTodayBadge(item: Item): boolean {
  return item.type !== 'habit' && isItemDueOn(item, logicalNow())
}

function getItemMeta(item: Item, effectiveDueDate?: string | null): string[] {
  const meta: string[] = []
  if (item.zone) meta.push(item.zone)
  if (item.type === 'chore' && item.recurrenceRule) meta.push(describeRecurrence(item.recurrenceRule))
  const windowText = describeWindow(item)
  if (windowText) meta.push(windowText)
  if (item.type === 'todo' && effectiveDueDate) {
    meta.push(describeDaysLeft(effectiveDueDate), `vence ${format(parseISO(effectiveDueDate), 'dd/MM')}`)
    if (item.postponedUntil) meta.push('aplazada')
  }
  return meta
}

function getFrameClass(done: boolean, overdue: boolean): string {
  if (done) return 'cv-panel--gold'
  if (overdue) return 'cv-panel--blood'
  return ''
}

/** "ayer" si la aparición fallada cerró ayer; si no, la fecha corta. */
function describeMissedOn(dateKey: string): string {
  return dateKey === format(subDays(logicalNow(), 1), 'yyyy-MM-dd')
    ? 'ayer'
    : format(parseISO(dateKey), 'dd/MM')
}

function ItemCard({ item, onOpen }: Readonly<{ item: Item; onOpen: () => void }>) {
  const history = useItemsStore((s) => s.completionsByItem[item.id]) ?? []
  const toggleBoolean = useItemsStore((s) => s.toggleBoolean)
  const adjustQuantity = useItemsStore((s) => s.adjustQuantity)
  const postponeItem = useItemsStore((s) => s.postponeItem)
  const postponeTokens = usePlayerStore((s) => s.profile?.postponeTokens ?? 0)
  const profile = usePlayerStore((s) => s.profile)
  const countsForBoss = useBossStore((s) => bossCountsFor(item, activeEncounter(s.encounters), todayKey()))
  const [popup, setPopup] = useState<RewardPopup | null>(null)
  const popupSeq = useRef(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isBoolean = item.trackingType === 'boolean'
  const goal = item.quantityGoal ?? 0
  const completion = completionInWindow(item, history, todayKey())
  const qty = completion?.quantityDone ?? 0
  // Con margen, la tarea cuenta como hecha si se cumplió en cualquier día de su ventana.
  const done = isWindowCompleted(item, history, todayKey())
  const step = item.quantityStep ?? Math.max(1, Math.round(goal / 10))
  const streak = computeStreak(item, history)
  // Solo una se muestra a la vez: una racha positiva anula los fallos previos.
  const missStreak = streak === 0 ? computeMissStreak(item, history) : 0
  const dueToday = isDueTodayBadge(item)
  // Obligación fallada que sigue pendiente: aparece hoy con la marca de su fallo.
  const missedOn = missedCarryOf(item, history, todayKey())
  const effectiveDueDate = item.postponedUntil ?? item.dueDate
  const overdue =
    item.type === 'todo' &&
    Boolean(effectiveDueDate) &&
    !done &&
    parseISO(effectiveDueDate as string) < startOfDay(logicalNow())
  const canPostpone =
    isObligation(item) && dueToday && !done && postponeTokens > 0 && marginDaysOf(item) === 1
  // Solo en tareas con margen: avisa de que hoy es el último día para cumplirla.
  const lastWindowDay =
    marginDaysOf(item) > 1 && !done && isWindowClosingOn(item, logicalNow())

  const frameClass = getFrameClass(done, overdue || missedOn !== null)
  const meta = getItemMeta(item, effectiveDueDate)

  const showReward = (direction: 1 | -1, xp: number) => {
    playWhip()
    const id = popupSeq.current + 1
    popupSeq.current = id
    setPopup({
      id,
      xp: direction * xp,
      coins: direction * DIFFICULTY_COINS[item.difficulty],
    })
    setTimeout(() => setPopup((p) => (p?.id === id ? null : p)), 1100)
  }

  const perform = async (action: () => Promise<unknown>, reward?: 1 | -1) => {
    // Se calcula antes de actuar: una victoria al completar apaga el efecto del boss durante la acción.
    const earned = reward === -1 && completion?.xpEarned
      ? completion.xpEarned
      : xpAfterBoss(xpWithBonus(DIFFICULTY_XP[item.difficulty], profile))
    setBusy(true)
    setError(null)
    try {
      await action()
      if (reward) showReward(reward, earned)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la actividad.')
    } finally {
      setBusy(false)
    }
  }

  const handleCandle = () => {
    if (isBoolean) {
      void perform(() => toggleBoolean(item.id), done ? -1 : 1)
      return
    }
    void perform(() => adjustQuantity(item.id, step), qty + step >= goal ? 1 : undefined)
  }

  const handleSubtractQuantity = () => {
    void perform(() => adjustQuantity(item.id, -step), qty >= goal && qty - step < goal ? -1 : undefined)
  }

  const handleCompleteQuantity = () => {
    void perform(() => adjustQuantity(item.id, goal - qty), qty < goal ? 1 : undefined)
  }

  const handlePostpone = () => {
    void perform(() => postponeItem(item.id))
  }

  let candleLabel = done ? 'Apagar vela' : 'Encender vela'
  if (!isBoolean) candleLabel = `Sumar ${step}`

  return (
    <div className={`cv-panel ${frameClass} ${countsForBoss ? 'cv-boss-glow' : ''} flex items-center gap-3 px-2 py-2`}>
      <button
        type="button"
        onClick={handleCandle}
        disabled={busy || profile?.dead || !isBoolean && done}
        className="shrink-0 px-1 transition-transform active:scale-90 disabled:cursor-default"
        aria-label={candleLabel}
      >
        <Candle lit={done} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={onOpen}
            className={`min-h-11 break-words py-1 text-left font-pixel text-2xl leading-none ${done ? 'text-gold-300' : 'text-silver-100'}`}
            aria-label={`Abrir ${item.title}`}
          >
            {item.title}
          </button>
          {(dueToday || missedOn !== null) && !done && <span className="cv-tag cv-tag--gold">Hoy</span>}
          {countsForBoss && (
            <span className="cv-tag cv-tag--boss">
              Boss<span className="sr-only">: cuenta para el boss</span>
            </span>
          )}
          {!isObligation(item) && <span className="cv-tag cv-tag--gold">Misión</span>}
          {overdue && <span className="cv-tag cv-tag--blood">Vencida</span>}
          {lastWindowDay && <span className="cv-tag cv-tag--blood">¡Último día!</span>}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Skulls difficulty={item.difficulty} />
          {streak > 0 && <span className="cv-label text-gold-400">Racha ×{streak}</span>}
          {missStreak > 0 && <span className="cv-label text-blood-400">Fallos seguidos ×{missStreak}</span>}
          {missedOn !== null && !done && (
            <span className="cv-label text-blood-400">Falló {describeMissedOn(missedOn)}</span>
          )}
        </div>

        {meta.length > 0 && (
          <p className="mt-0.5 font-body text-sm text-silver-500 italic">{meta.join(' · ')}</p>
        )}
        {error && (
          <div role="alert" className="mt-1 font-body text-sm text-blood-400">
            <p>{error}</p>
            <Link to={`/calendario?date=${completion?.date ?? todayKey()}`} className="underline">Abrir detalle y corrección</Link>
          </div>
        )}

        {!isBoolean && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="cv-bar flex-1">
              <span
                className="cv-fill-mp"
                style={{ width: `${goal ? Math.min(100, (qty / goal) * 100) : 0}%` }}
              />
            </div>
            <span className="font-pixel text-lg leading-none text-silver-300">
              {qty}/{goal} {item.unit}
            </span>
          </div>
        )}
      </div>

      {canPostpone && (
        <button
          type="button"
          onClick={handlePostpone}
          disabled={busy}
          className="cv-btn cv-btn--ghost shrink-0 px-2 py-1 text-sm"
          aria-label={`Posponer ${item.title}`}
        >
          Mañana
        </button>
      )}

      {!isBoolean && (
        <button
          type="button"
          onClick={handleSubtractQuantity}
          disabled={busy || profile?.dead}
          className="cv-btn shrink-0 px-2.5"
          aria-label={`Restar ${step}`}
        >
          −
        </button>
      )}

      {!isBoolean && item.type === 'habit' && (
        <button
          type="button"
          onClick={handleCompleteQuantity}
          disabled={busy || profile?.dead || done}
          className="cv-btn cv-btn--gold shrink-0 px-2 py-1 text-sm"
          aria-label={`Completar ${item.title}`}
        >
          Completar
        </button>
      )}

      {popup && (
        <div
          key={popup.id}
          className="cv-float cv-shadow pointer-events-none absolute top-1 right-3 font-pixel text-xl leading-none"
        >
          <span className={popup.xp > 0 ? 'text-gold-300' : 'text-blood-400'}>
            {popup.xp > 0 ? '+' : ''}{popup.xp} EXP
          </span>{' '}
          <span className={popup.coins > 0 ? 'text-silver-100' : 'text-blood-400'}>
            {popup.coins > 0 ? '+' : ''}{popup.coins} ORO
          </span>
        </div>
      )}
    </div>
  )
}

export default ItemCard
