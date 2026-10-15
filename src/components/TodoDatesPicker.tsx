import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { todayKey } from '../lib/date'
import { isTodoScheduleValid } from '../lib/recurrence'

function TodoDatesPicker({
  startDate,
  dueDate,
  onStartDateChange,
  onDueDateChange,
}: Readonly<{
  startDate: string
  dueDate: string
  onStartDateChange: (value: string) => void
  onDueDateChange: (value: string) => void
}>) {
  const valid = isTodoScheduleValid(startDate, dueDate)
  const margin = startDate && valid
    ? differenceInCalendarDays(parseISO(dueDate), parseISO(startDate)) + 1
    : 1

  let hint: string
  if (!valid) hint = 'Aparece debe ser igual o anterior al vencimiento.'
  else if (!startDate) hint = 'Sin fecha de aparición: visible desde que se crea.'
  else if (margin === 1) hint = 'Sin margen: aparece y vence el mismo día.'
  else hint = `Margen de ${margin} días: se puede cumplir desde el ${format(parseISO(startDate), 'dd/MM')} hasta el vencimiento.`

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="cv-label">Aparece el</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="cv-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="cv-label">Vence el</span>
          <input
            type="date"
            min={todayKey()}
            value={dueDate}
            onChange={(event) => onDueDateChange(event.target.value)}
            className="cv-input"
          />
        </label>
      </div>
      <p className={`font-body text-sm italic ${valid ? 'text-silver-500' : 'text-blood-400'}`}>{hint}</p>
    </div>
  )
}

export default TodoDatesPicker
