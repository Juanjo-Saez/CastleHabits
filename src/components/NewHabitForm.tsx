import { useState } from 'react'
import { useItemsStore } from '../store/useItemsStore'
import type { Difficulty, RouteId, TrackingType } from '../types'
import DifficultyPicker from './DifficultyPicker'
import RoutePicker from './RoutePicker'
import SectionTitle from './SectionTitle'

function NewHabitForm({ onClose }: Readonly<{ onClose: () => void }>) {
  const addItem = useItemsStore((s) => s.addItem)
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [trackingType, setTrackingType] = useState<TrackingType>('boolean')
  const [quantityGoal, setQuantityGoal] = useState(10)
  const [unit, setUnit] = useState('reps')
  const [routeId, setRouteId] = useState<RouteId | undefined>()

  const handleSubmit = async () => {
    if (!title.trim()) return
    await addItem({
      type: 'habit',
      commitment: 'sideQuest',
      title: title.trim(),
      difficulty,
      trackingType,
      quantityGoal: trackingType === 'quantity' ? quantityGoal : undefined,
      unit: trackingType === 'quantity' ? unit : undefined,
      routeId,
    })
    onClose()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void handleSubmit()
      }}
      className="cv-panel flex flex-col gap-3 p-3"
    >
      <SectionTitle>Nueva misión secundaria</SectionTitle>

      <label className="flex flex-col gap-1">
        <span className="cv-label">Nombre</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Meditar, leer, 100 sentadillas..."
          className="cv-input"
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="cv-label">Dificultad</span>
        <DifficultyPicker value={difficulty} onChange={setDifficulty} />
      </div>

      <RoutePicker value={routeId} onChange={setRouteId} />

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

      {trackingType === 'quantity' && (
        <div className="flex gap-2">
          <label className="flex w-24 flex-col gap-1">
            <span className="cv-label">Meta</span>
            <input
              type="number"
              min={1}
              value={quantityGoal}
              onChange={(e) => setQuantityGoal(Number(e.target.value))}
              className="cv-input"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="cv-label">Unidad</span>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="reps, min..."
              className="cv-input"
            />
          </label>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="cv-btn cv-btn--ghost">
          Cancelar
        </button>
        <button type="submit" className="cv-btn cv-btn--gold">
          Invocar
        </button>
      </div>
    </form>
  )
}

export default NewHabitForm
