import { format, parseISO } from 'date-fns'
import { todayKey } from '../lib/date'
import { describeRecurrence, type RecurrenceUnit } from '../lib/recurrence'
import { ruleFromDraft, startDatePresets, type RecurrenceDraft } from '../lib/recurrenceDraft'

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const UNITS: { value: RecurrenceUnit; label: string; singular: string; plural: string }[] = [
  { value: 'day', label: 'Día', singular: 'día', plural: 'días' },
  { value: 'week', label: 'Semana', singular: 'semana', plural: 'semanas' },
  { value: 'month', label: 'Mes', singular: 'mes', plural: 'meses' },
]

function RecurrencePicker({
  value,
  onChange,
}: Readonly<{ value: RecurrenceDraft; onChange: (draft: RecurrenceDraft) => void }>) {
  const unit = UNITS.find((u) => u.value === value.unit) ?? UNITS[0]
  const update = (patch: Partial<RecurrenceDraft>) => onChange({ ...value, ...patch })

  const toggleWeekday = (day: number) => {
    const weekdays = value.weekdays.includes(day)
      ? value.weekdays.filter((d) => d !== day)
      : [...value.weekdays, day].sort((a, b) => a - b)
    update({ weekdays })
  }

  const canSummarize = value.startDate >= todayKey()
  const summary = canSummarize
    ? `${describeRecurrence(ruleFromDraft(value))} · desde ${format(parseISO(value.startDate), 'dd/MM/yyyy')}`
    : 'Elige una fecha de inicio válida.'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="cv-label">Se repite cada</span>
        <div className="grid grid-cols-3 gap-2">
          {UNITS.map((u) => (
            <button
              key={u.value}
              type="button"
              onClick={() => update({ unit: u.value })}
              className={`cv-btn ${value.unit === u.value ? 'cv-btn--active' : ''}`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="cv-label">Cada</span>
        <input
          type="number"
          min={1}
          max={99}
          value={value.interval}
          onChange={(e) => update({ interval: Math.min(99, Math.max(1, Number(e.target.value) || 1)) })}
          className="cv-input w-20"
          aria-label={`Cada cuántos ${unit.plural}`}
        />
        <span className="font-body text-silver-300">
          {value.interval === 1 ? unit.singular : unit.plural}
        </span>
      </div>

      {value.unit === 'week' && (
        <div className="flex flex-col gap-1">
          <span className="cv-label">Días de la semana</span>
          <div className="flex justify-between gap-1">
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleWeekday(day)}
                className={`cv-btn flex-1 px-0 ${value.weekdays.includes(day) ? 'cv-btn--active' : ''}`}
                aria-pressed={value.weekdays.includes(day)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {value.unit === 'month' && (
        <div className="flex flex-col gap-1">
          <span className="cv-label">Día del mes</span>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={31}
              value={value.monthDay}
              disabled={value.lastDay}
              onChange={(e) => update({ monthDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
              className="cv-input w-20"
              aria-label="Día del mes"
            />
            <button
              type="button"
              onClick={() => update({ lastDay: !value.lastDay })}
              className={`cv-btn flex-1 ${value.lastDay ? 'cv-btn--active' : ''}`}
              aria-pressed={value.lastDay}
            >
              Último día
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="cv-label">Empieza el</span>
        <input
          type="date"
          min={todayKey()}
          value={value.startDate}
          onChange={(e) => update({ startDate: e.target.value })}
          className="cv-input"
        />
        <div className="grid grid-cols-3 gap-2">
          {startDatePresets().map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => update({ startDate: preset.value })}
              className={`cv-btn px-1 py-1 text-sm ${value.startDate === preset.value ? 'cv-btn--active' : ''}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="font-body text-sm text-silver-500 italic">
          Antes de esta fecha la tarea no exige nada ni causa daño.
        </p>
      </div>

      <p className="cv-shadow font-pixel text-lg leading-none text-gold-300">{summary}</p>
    </div>
  )
}

export default RecurrencePicker
