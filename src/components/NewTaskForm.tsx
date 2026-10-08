import { useState } from 'react'
import { todayKey } from '../lib/date'
import {
  defaultRecurrenceDraft,
  isDraftValid,
  ruleFromDraft,
} from '../lib/recurrenceDraft'
import { useItemsStore } from '../store/useItemsStore'
import type { Difficulty } from '../types'
import DifficultyPicker from './DifficultyPicker'
import RecurrencePicker from './RecurrencePicker'
import SectionTitle from './SectionTitle'

function NewTaskForm({ onClose }: Readonly<{ onClose: () => void }>) {
  const addItem = useItemsStore((s) => s.addItem)
  const [kind, setKind] = useState<'chore' | 'todo'>('chore')
  const [title, setTitle] = useState('')
  const [zone, setZone] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [recurrence, setRecurrence] = useState(defaultRecurrenceDraft)
  const [dueDate, setDueDate] = useState(todayKey())

  const scheduleValid = kind === 'todo' ? Boolean(dueDate) : isDraftValid(recurrence)
  const canSubmit = Boolean(title.trim()) && scheduleValid

  const handleSubmit = async () => {
    if (!canSubmit) return

    if (kind === 'chore') {
      await addItem({
        type: 'chore',
        commitment: 'obligation',
        title: title.trim(),
        zone: zone.trim() || undefined,
        difficulty,
        trackingType: 'boolean',
        recurrenceRule: ruleFromDraft(recurrence),
        startDate: recurrence.startDate,
      })
    } else {
      await addItem({
        type: 'todo',
        commitment: 'obligation',
        title: title.trim(),
        difficulty,
        trackingType: 'boolean',
        dueDate,
      })
    }
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
      <SectionTitle>Nueva tarea</SectionTitle>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setKind('chore')}
          className={`cv-btn ${kind === 'chore' ? 'cv-btn--active' : ''}`}
        >
          Recurrente
        </button>
        <button
          type="button"
          onClick={() => setKind('todo')}
          className={`cv-btn ${kind === 'todo' ? 'cv-btn--active' : ''}`}
        >
          Pergamino
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="cv-label">Nombre</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Fregar, barrer, pagar el alquiler..."
          className="cv-input"
        />
      </label>

      {kind === 'chore' && (
        <label className="flex flex-col gap-1">
          <span className="cv-label">Estancia</span>
          <input
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="Cocina, Baño, Biblioteca..."
            className="cv-input"
          />
        </label>
      )}

      <div className="flex flex-col gap-1">
        <span className="cv-label">Dificultad</span>
        <DifficultyPicker value={difficulty} onChange={setDifficulty} />
      </div>

      {kind === 'chore' ? (
        <RecurrencePicker value={recurrence} onChange={setRecurrence} />
      ) : (
        <label className="flex flex-col gap-1">
          <span className="cv-label">Vence</span>
          <input
            type="date"
            min={todayKey()}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="cv-input"
          />
        </label>
      )}

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

export default NewTaskForm
