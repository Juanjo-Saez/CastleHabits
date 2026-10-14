import { useState } from 'react'
import { useRemindersStore } from '../store/useRemindersStore'
import type { ReminderUnit } from '../types'
import NumberField from './NumberField'
import SectionTitle from './SectionTitle'

function NewReminderForm({ onClose }: Readonly<{ onClose: () => void }>) {
  const addReminder = useRemindersStore((s) => s.addReminder)
  const [title, setTitle] = useState('')
  const [every, setEvery] = useState(1)
  const [unit, setUnit] = useState<ReminderUnit>('month')

  const canSubmit = Boolean(title.trim())

  const handleSubmit = async () => {
    if (!canSubmit) return
    await addReminder(title.trim(), every, unit)
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
      <SectionTitle>Nuevo recordatorio</SectionTitle>
      <p className="text-sm text-silver-500">
        Solo avisa. No crea una tarea ni aplica daño, EXP ni monedas.
      </p>

      <label className="flex flex-col gap-1">
        <span className="cv-label">Nombre</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lavar la cafetera, cambiar el filtro..."
          className="cv-input"
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="cv-label">Avisar cada</span>
        <div className="grid grid-cols-[auto_1fr] items-center gap-2">
          <NumberField
            value={every}
            min={1}
            max={99}
            onCommit={setEvery}
            ariaLabel="Cada cuántos"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setUnit('day')}
              className={`cv-btn ${unit === 'day' ? 'cv-btn--active' : ''}`}
            >
              Días
            </button>
            <button
              type="button"
              onClick={() => setUnit('month')}
              className={`cv-btn ${unit === 'month' ? 'cv-btn--active' : ''}`}
            >
              Meses
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="cv-btn cv-btn--ghost">
          Cancelar
        </button>
        <button type="submit" disabled={!canSubmit} className="cv-btn cv-btn--gold">
          Añadir
        </button>
      </div>
    </form>
  )
}

export default NewReminderForm
