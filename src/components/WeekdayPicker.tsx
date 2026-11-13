import { ONBOARDING_WEEKDAYS } from '../lib/onboardingPlan'

function WeekdayPicker({
  value,
  onChange,
  label = 'Días de la semana',
}: Readonly<{
  value: number[]
  onChange: (days: number[]) => void
  label?: string
}>) {
  const toggle = (day: number) => {
    const next = value.includes(day)
      ? value.filter((current) => current !== day)
      : [...value, day].sort((left, right) => left - right)
    onChange(next)
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="cv-label">{label}</legend>
      <div className="grid grid-cols-7 gap-1">
        {ONBOARDING_WEEKDAYS.map((day) => (
          <button
            key={day.value}
            type="button"
            aria-label={day.name}
            aria-pressed={value.includes(day.value)}
            onClick={() => toggle(day.value)}
            className={`cv-btn min-h-11 px-1 ${value.includes(day.value) ? 'cv-btn--active' : ''}`}
          >
            {day.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export default WeekdayPicker
