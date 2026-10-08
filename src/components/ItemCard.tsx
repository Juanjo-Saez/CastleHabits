import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import { describeDaysLeft } from '../lib/date'
import { DIFFICULTY_COINS, DIFFICULTY_XP } from '../lib/gamification'
import { describeRecurrence, isItemDueOn, isObligation } from '../lib/recurrence'
import { playWhip } from '../lib/sound'
import { computeStreak } from '../lib/streak'
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
  return item.type !== 'habit' && isItemDueOn(item, new Date())
}

function getItemMeta(item: Item, effectiveDueDate?: string | null): string[] {
  const meta: string[] = []
  if (item.zone) meta.push(item.zone)
  if (item.type === 'chore' && item.recurrenceRule) meta.push(describeRecurrence(item.recurrenceRule))
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

function ItemCard({ item }: Readonly<{ item: Item }>) {
  const completion = useItemsStore((s) => s.completionsToday[item.id])
  const history = useItemsStore((s) => s.completionsByItem[item.id]) ?? []
  const toggleBoolean = useItemsStore((s) => s.toggleBoolean)
  const adjustQuantity = useItemsStore((s) => s.adjustQuantity)
  const postponeItem = useItemsStore((s) => s.postponeItem)
  const postponeTokens = usePlayerStore((s) => s.profile?.postponeTokens ?? 0)
  const [popup, setPopup] = useState<RewardPopup | null>(null)

  const isBoolean = item.trackingType === 'boolean'
  const goal = item.quantityGoal ?? 0
  const qty = completion?.quantityDone ?? 0
  const done = isBoolean ? Boolean(completion) : qty >= goal
  const step = Math.max(1, Math.round(goal / 10))
  const streak = computeStreak(item, history)
  const dueToday = isDueTodayBadge(item)
  const effectiveDueDate = item.postponedUntil ?? item.dueDate
  const overdue =
    item.type === 'todo' &&
    Boolean(effectiveDueDate) &&
    !done &&
    parseISO(effectiveDueDate as string) < new Date(new Date().setHours(0, 0, 0, 0))
  const canPostpone = isObligation(item) && dueToday && !done && postponeTokens > 0

  const frameClass = getFrameClass(done, overdue)
  const meta = getItemMeta(item, effectiveDueDate)

  const showReward = (direction: 1 | -1) => {
    playWhip()
    const id = Date.now()
    setPopup({
      id,
      xp: direction * DIFFICULTY_XP[item.difficulty],
      coins: direction * DIFFICULTY_COINS[item.difficulty],
    })
    setTimeout(() => setPopup((p) => (p?.id === id ? null : p)), 1100)
  }

  const handleCandle = () => {
    if (isBoolean) {
      showReward(done ? -1 : 1)
      void toggleBoolean(item.id)
      return
    }
    if (qty + step >= goal) showReward(1)
    void adjustQuantity(item.id, step)
  }

  const handleSubtractQuantity = () => {
    if (qty >= goal && qty - step < goal) showReward(-1)
    void adjustQuantity(item.id, -step)
  }

  const handlePostpone = () => {
    void postponeItem(item.id)
  }

  let candleLabel = done ? 'Apagar vela' : 'Encender vela'
  if (!isBoolean) candleLabel = `Sumar ${step}`

  return (
    <div className={`cv-panel ${frameClass} flex items-center gap-3 px-2 py-2`}>
      <button
        type="button"
        onClick={handleCandle}
        disabled={!isBoolean && done}
        className="shrink-0 px-1 transition-transform active:scale-90 disabled:cursor-default"
        aria-label={candleLabel}
      >
        <Candle lit={done} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p
            className={`cv-shadow font-pixel text-2xl leading-none ${done ? 'text-gold-300' : 'text-silver-100'}`}
          >
            {item.title}
          </p>
          {dueToday && !done && <span className="cv-tag cv-tag--gold">Hoy</span>}
          {!isObligation(item) && <span className="cv-tag cv-tag--gold">Misión</span>}
          {overdue && <span className="cv-tag cv-tag--blood">Vencida</span>}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Skulls difficulty={item.difficulty} />
          {streak > 0 && <span className="cv-label text-gold-400">Racha ×{streak}</span>}
        </div>

        {meta.length > 0 && (
          <p className="mt-0.5 font-body text-sm text-silver-500 italic">{meta.join(' · ')}</p>
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
          className="cv-btn shrink-0 px-2.5"
          aria-label={`Restar ${step}`}
        >
          −
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
