import { useState } from 'react'
import { todayKey } from '../lib/date'
import { DIFFICULTY_LABEL } from '../lib/gamification'
import { buildRecurrenceRule, type RecurrenceKind } from '../lib/recurrence'
import { useItemsStore } from '../store/useItemsStore'
import type { Difficulty } from '../types'

const inputClasses =
  'rounded-sm border border-gold-600/30 bg-crypt-950 px-3 py-2 font-body text-sm text-parchment-100 placeholder:text-parchment-500/60 focus:border-gold-500 focus:outline-none'

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
      className="mx-5 mb-4 flex flex-col gap-3 rounded-sm border border-gold-600/30 bg-crypt-900/80 p-4"
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setKind('chore')}
          className={`flex-1 rounded-sm border px-3 py-1.5 font-heading text-xs tracking-wide ${
            kind === 'chore'
              ? 'border-gold-500/60 bg-gold-500/10 text-gold-400'
              : 'border-parchment-500/20 text-parchment-500'
          }`}
        >
          Tarea recurrente
        </button>
        <button
          type="button"
          onClick={() => setKind('todo')}
          className={`flex-1 rounded-sm border px-3 py-1.5 font-heading text-xs tracking-wide ${
            kind === 'todo'
              ? 'border-gold-500/60 bg-gold-500/10 text-gold-400'
              : 'border-parchment-500/20 text-parchment-500'
          }`}
        >
          Tarea puntual
        </button>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nombre de la tarea..."
        className={inputClasses}
      />

      {kind === 'chore' && (
        <input
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          placeholder="Estancia (ej. Cocina, Baño...)"
          className={inputClasses}
        />
      )}

      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
        className={`${inputClasses} py-2 text-xs`}
      >
        {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
          <option key={d} value={d}>
            {DIFFICULTY_LABEL[d]}
          </option>
        ))}
      </select>

      {kind === 'chore' ? (
        <div className="flex flex-col gap-2 border-t border-gold-600/20 pt-3">
          <select
            value={recurrenceKind}
            onChange={(e) => setRecurrenceKind(e.target.value as RecurrenceKind)}
            className={`${inputClasses} py-2 text-xs`}
          >
            <option value="daily">Cada día</option>
            <option value="interval">Cada N días</option>
            <option value="weekdays">Días concretos de la semana</option>
            <option value="monthly">Día concreto del mes</option>
          </select>

          {recurrenceKind === 'interval' && (
            <input
              type="number"
              min={2}
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className={inputClasses}
            />
          )}

          {recurrenceKind === 'weekdays' && (
            <div className="flex gap-1.5">
              {WEEKDAY_LABELS.map((label, day) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  className={`h-8 w-8 rounded-full border text-xs ${
                    weekdays.includes(day)
                      ? 'border-gold-400 bg-gold-500/20 text-gold-400'
                      : 'border-parchment-500/30 text-parchment-500'
                  }`}
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
              className={inputClasses}
            />
          )}
        </div>
      ) : (
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={inputClasses}
        />
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
          Añadir
        </button>
      </div>
    </form>
  )
}

export default NewTaskForm
