import { DIFFICULTY_LABEL } from '../lib/gamification'
import { computeStreak } from '../lib/streak'
import { useItemsStore } from '../store/useItemsStore'
import type { Item } from '../types'

function HabitCard({ item }: Readonly<{ item: Item }>) {
  const completion = useItemsStore((s) => s.completionsToday[item.id])
  const history = useItemsStore((s) => s.completionsByItem[item.id]) ?? []
  const toggleBoolean = useItemsStore((s) => s.toggleBoolean)
  const adjustQuantity = useItemsStore((s) => s.adjustQuantity)

  const isBoolean = item.trackingType === 'boolean'
  const goal = item.quantityGoal ?? 0
  const qty = completion?.quantityDone ?? 0
  const done = isBoolean ? Boolean(completion) : qty >= goal
  const step = Math.max(1, Math.round(goal / 10))
  const streak = computeStreak(item, history)

  return (
    <div
      className={`flex items-center gap-3 rounded-sm border px-4 py-3 transition-colors ${
        done
          ? 'border-gold-500/60 bg-crypt-800/80'
          : 'border-gold-600/20 bg-crypt-900/60'
      }`}
    >
      <span className="text-xl">{item.icon ?? '✦'}</span>

      <div className="min-w-0 flex-1">
        <p
          className={`font-heading text-sm tracking-wide ${done ? 'text-gold-400' : 'text-parchment-100'}`}
        >
          {item.title}
        </p>
        <p className="text-xs italic text-parchment-500">
          {DIFFICULTY_LABEL[item.difficulty]}
          {streak > 0 && ` · 🔥 ${streak}`}
          {!isBoolean && ` · ${qty}/${goal} ${item.unit ?? ''}`.trimEnd()}
        </p>
        {!isBoolean && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-crypt-700">
            <div
              className="h-full bg-gradient-to-r from-blood-600 to-gold-500 transition-all"
              style={{
                width: `${goal ? Math.min(100, (qty / goal) * 100) : 0}%`,
              }}
            />
          </div>
        )}
      </div>

      {isBoolean ? (
        <button
          type="button"
          onClick={() => toggleBoolean(item.id)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm transition-colors ${
            done
              ? 'border-gold-400 bg-gold-500/20 text-gold-400'
              : 'border-parchment-500/40 text-parchment-500/40 hover:border-gold-500/60'
          }`}
          aria-label={done ? 'Marcar como pendiente' : 'Marcar como completado'}
        >
          ✦
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => adjustQuantity(item.id, -step)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-parchment-500/30 text-parchment-300 hover:border-gold-500/60"
            aria-label="Restar"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => adjustQuantity(item.id, step)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-600/40 text-gold-400 hover:border-gold-400"
            aria-label="Sumar"
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}

export default HabitCard
