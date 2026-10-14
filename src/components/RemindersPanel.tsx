import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { todayKey } from '../lib/date'
import {
  describeReminderInterval,
  isReminderDue,
  nextReminderDate,
} from '../lib/reminders'
import { useRemindersStore } from '../store/useRemindersStore'
import type { Reminder } from '../types'
import NewReminderForm from './NewReminderForm'
import SectionTitle from './SectionTitle'

function ReminderRow({ reminder, due }: Readonly<{ reminder: Reminder; due: boolean }>) {
  const markDone = useRemindersStore((s) => s.markDone)
  const snooze = useRemindersStore((s) => s.snooze)
  const archive = useRemindersStore((s) => s.archive)

  const key = todayKey()
  const wakeKey =
    reminder.snoozedUntil && reminder.snoozedUntil > key
      ? reminder.snoozedUntil
      : nextReminderDate(reminder)
  const dateLabel = format(parseISO(wakeKey), 'dd/MM/yyyy')

  return (
    <article className="cv-panel flex flex-col gap-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-pixel text-xl text-silver-100">{reminder.title}</h3>
        {due && <span className="cv-tag cv-tag--gold">Toca</span>}
      </div>
      <p className="text-sm text-silver-500">
        {describeReminderInterval(reminder.every, reminder.unit)} ·{' '}
        {due ? `pendiente desde el ${dateLabel}` : `pr\u00f3ximo aviso el ${dateLabel}`}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void markDone(reminder.id)}
          className={`cv-btn flex-1 ${due ? 'cv-btn--gold' : ''}`}
        >
          Hecho
        </button>
        {due && (
          <button type="button" onClick={() => void snooze(reminder.id)} className="cv-btn flex-1">
            Más tarde
          </button>
        )}
        <button
          type="button"
          onClick={() => void archive(reminder.id)}
          className="cv-btn cv-btn--ghost px-2 text-sm"
        >
          Archivar
        </button>
      </div>
    </article>
  )
}

/** Avisos periódicos sin tarea: no generan obligaciones, daño, EXP ni monedas. */
function RemindersPanel() {
  const reminders = useRemindersStore((s) => s.reminders)
  const loading = useRemindersStore((s) => s.loading)
  const [showForm, setShowForm] = useState(false)

  const key = todayKey()
  const due = reminders
    .filter((r) => isReminderDue(r, key))
    .sort((a, b) => nextReminderDate(a).localeCompare(nextReminderDate(b)))
  const upcoming = reminders
    .filter((r) => !isReminderDue(r, key))
    .sort((a, b) => nextReminderDate(a).localeCompare(nextReminderDate(b)))

  return (
    <>
      <SectionTitle
        action={
          <button
            type="button"
            onClick={() => setShowForm((visible) => !visible)}
            className="cv-btn cv-btn--gold px-2 py-1 text-base"
          >
            {showForm ? 'Cerrar' : '+ Recordatorio'}
          </button>
        }
      >
        Recordatorios
      </SectionTitle>

      {showForm && <NewReminderForm onClose={() => setShowForm(false)} />}

      {loading ? null : reminders.length === 0 ? (
        <p className="py-2 text-center font-pixel text-lg text-silver-700">
          — SIN RECORDATORIOS —
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {due.map((r) => (
            <ReminderRow key={r.id} reminder={r} due />
          ))}
          {upcoming.map((r) => (
            <ReminderRow key={r.id} reminder={r} due={false} />
          ))}
        </div>
      )}
    </>
  )
}

export default RemindersPanel
