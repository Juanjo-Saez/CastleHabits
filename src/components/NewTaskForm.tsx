import { useState } from 'react'
import { todayKey } from '../lib/date'
import { isTodoScheduleValid } from '../lib/recurrence'
import {
  defaultRecurrenceDraft,
  isDraftValid,
  ruleFromDraft,
  windowFromDraft,
} from '../lib/recurrenceDraft'
import { useItemsStore } from '../store/useItemsStore'
import type { Difficulty, RouteId } from '../types'
import DifficultyPicker from './DifficultyPicker'
import RecurrencePicker from './RecurrencePicker'
import RoutePicker from './RoutePicker'
import SectionTitle from './SectionTitle'
import TodoDatesPicker from './TodoDatesPicker'
import ZonePicker from './ZonePicker'

function NewTaskForm({
  onClose,
  initialTitle,
  onCreated,
}: Readonly<{ onClose: () => void; initialTitle?: string; onCreated?: () => void }>) {
  const addItem = useItemsStore((s) => s.addItem)
  const [kind, setKind] = useState<'chore' | 'todo'>(initialTitle ? 'todo' : 'chore')
  const [title, setTitle] = useState(initialTitle ?? '')
  const [zone, setZone] = useState('Castle')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [recurrence, setRecurrence] = useState(defaultRecurrenceDraft)
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState(todayKey())
  const [routeId, setRouteId] = useState<RouteId | undefined>()

  const handleStartDateChange = (value: string) => {
    const previousDefault = startDate || todayKey()
    setStartDate(value)
    if (value && (dueDate === previousDefault || dueDate < value)) setDueDate(value)
  }

  const scheduleValid = kind === 'todo' ? isTodoScheduleValid(startDate, dueDate) : isDraftValid(recurrence)
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
        windowDays: windowFromDraft(recurrence),
        routeId,
      })
    } else {
      await addItem({
        type: 'todo',
        commitment: 'obligation',
        title: title.trim(),
        difficulty,
        trackingType: 'boolean',
        dueDate,
        startDate: startDate || undefined,
      })
    }
    onCreated?.()
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
        <ZonePicker value={zone} onChange={setZone} />
      )}

      <div className="flex flex-col gap-1">
        <span className="cv-label">Dificultad</span>
        <DifficultyPicker value={difficulty} onChange={setDifficulty} />
      </div>

      <RoutePicker value={routeId} onChange={setRouteId} />

      {kind === 'chore' ? (
        <RecurrencePicker value={recurrence} onChange={setRecurrence} />
      ) : (
        <TodoDatesPicker
          startDate={startDate}
          dueDate={dueDate}
          onStartDateChange={handleStartDateChange}
          onDueDateChange={setDueDate}
        />
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
