import { useState, type FormEvent } from 'react'
import { DIFFICULTY_LABEL } from '../lib/gamification'
import { useItemsStore } from '../store/useItemsStore'
import type { Difficulty, TrackingType } from '../types'

const inputClasses =
  'rounded-sm border border-gold-600/30 bg-crypt-950 px-3 py-2 font-body text-sm text-parchment-100 placeholder:text-parchment-500/60 focus:border-gold-500 focus:outline-none'

function NewHabitForm({ onClose }: Readonly<{ onClose: () => void }>) {
  const addItem = useItemsStore((s) => s.addItem)
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [trackingType, setTrackingType] = useState<TrackingType>('boolean')
  const [quantityGoal, setQuantityGoal] = useState(10)
  const [unit, setUnit] = useState('reps')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await addItem({
      type: 'habit',
      title: title.trim(),
      difficulty,
      trackingType,
      quantityGoal: trackingType === 'quantity' ? quantityGoal : undefined,
      unit: trackingType === 'quantity' ? unit : undefined,
    })
    onClose()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-5 mb-4 flex flex-col gap-3 rounded-sm border border-gold-600/30 bg-crypt-900/80 p-4"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nombre del ritual..."
        className={inputClasses}
      />

      <div className="flex gap-2">
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className={`${inputClasses} flex-1 py-2 text-xs`}
        >
          {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABEL[d]}
            </option>
          ))}
        </select>

        <select
          value={trackingType}
          onChange={(e) => setTrackingType(e.target.value as TrackingType)}
          className={`${inputClasses} flex-1 py-2 text-xs`}
        >
          <option value="boolean">Sí / No</option>
          <option value="quantity">Cantidad</option>
        </select>
      </div>

      {trackingType === 'quantity' && (
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={quantityGoal}
            onChange={(e) => setQuantityGoal(Number(e.target.value))}
            className={`${inputClasses} w-24`}
          />
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="unidad (reps, min...)"
            className={`${inputClasses} flex-1`}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 font-body text-xs text-parchment-500 hover:text-parchment-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-sm border border-gold-500/60 bg-gold-500/10 px-4 py-1.5 font-heading text-xs tracking-wide text-gold-400 hover:bg-gold-500/20"
        >
          Invocar
        </button>
      </div>
    </form>
  )
}

export default NewHabitForm
