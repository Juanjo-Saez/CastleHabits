import { useState } from 'react'
import { todayKey } from '../lib/date'
import { buildRecurrenceRule, type RecurrenceKind } from '../lib/recurrence'
import { useItemsStore } from '../store/useItemsStore'
import type { Difficulty } from '../types'
import DifficultyPicker from './DifficultyPicker'
import SectionTitle from './SectionTitle'

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function NewTaskForm({ onClose }: Readonly<{ onClose: () => void }>) {
  const addItem = useItemsStore((s) => s.addItem)
  const [kind, setKind] = useState<'chore' | 'todo'>('chore')
  const [title, setTitle] = useState('')
  const [zone, setZone] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [recurrenceKind, setRecurrenceKind] = useState<RecurrenceKind>('daily')
  const [interval, setInterval] = useState(2)
  const [weekdays, setWeekdays] = useState<number[]>([0])
  const [monthDay, setMonthDay] = useState(1)
  const [dueDate, setDueDate] = useState(todayKey())

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b),
    )
  }

  const handleSubmit = async () => {
    if (!title.trim()) return

    if (kind === 'chore') {
      const recurrenceRule = buildRecurrenceRule(
        { kind: recurrenceKind, interval, weekdays, monthDay },
        new Date(),
      )
      await addItem({
        type: 'chore',
        title: title.trim(),
        zone: zone.trim() || undefined,
        difficulty,
        trackingType: 'boolean',
        recurrenceRule,
      })
    } else {
      await addItem({
        type: 'todo',
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
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span className="cv-label">Frecuencia</span>
            <select
              value={recurrenceKind}
              onChange={(e) => setRecurrenceKind(e.target.value as RecurrenceKind)}
              className="cv-input"
            >
              <option value="daily">Cada día</option>
              <option value="interval">Cada N días</option>
              <option value="weekdays">Días de la semana</option>
              <option value="monthly">Día del mes</option>
            </select>
          </label>

          {recurrenceKind === 'interval' && (
            <input
              type="number"
              min={2}
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="cv-input"
              aria-label="Cada cuántos días"
            />
          )}

          {recurrenceKind === 'weekdays' && (
            <div className="flex justify-between gap-1">
              {WEEKDAY_LABELS.map((label, day) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  className={`cv-btn flex-1 px-0 ${weekdays.includes(day) ? 'cv-btn--active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {recurrenceKind === 'monthly' && (
            <input
              type="number"
              min={1}
              max={31}
              value={monthDay}
              onChange={(e) => setMonthDay(Number(e.target.value))}
              className="cv-input"
              aria-label="Día del mes"
            />
          )}
        </div>
      ) : (
        <label className="flex flex-col gap-1">
          <span className="cv-label">Vence</span>
          <input
            type="date"
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
        <button type="submit" className="cv-btn cv-btn--gold">
          Añadir
        </button>
      </div>
    </form>
  )
}

export default NewTaskForm
