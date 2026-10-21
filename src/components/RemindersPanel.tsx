import { useState } from 'react'
import { useRemindersStore } from '../store/useRemindersStore'
import type { Reminder } from '../types'
import NewReminderForm from './NewReminderForm'
import NewTaskForm from './NewTaskForm'
import SectionTitle from './SectionTitle'

/** Pendientes sin fecha: no se completan ni generan daño; solo pueden convertirse en tarea. */
function RemindersPanel() {
  const reminders = useRemindersStore((s) => s.reminders)
  const loading = useRemindersStore((s) => s.loading)
  const archive = useRemindersStore((s) => s.archive)
  const [open, setOpen] = useState(false)
  const [converting, setConverting] = useState<Reminder | null>(null)

  return (
    <>
      <SectionTitle
        action={
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((visible) => !visible)}
            className="cv-btn px-2 py-1 text-base"
          >
            {open ? 'Ocultar' : `Ver (${reminders.length})`}
          </button>
        }
      >
        Recordatorios
      </SectionTitle>

      {open && (
        <div className="cv-panel flex flex-col gap-3 p-3">
          <NewReminderForm />

          {converting && (
            <NewTaskForm
              initialTitle={converting.title}
              onCreated={() => void archive(converting.id)}
              onClose={() => setConverting(null)}
            />
          )}

          {loading ? null : reminders.length === 0 ? (
            <p className="py-2 text-center font-pixel text-lg text-silver-700">
              — SIN PENDIENTES —
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {reminders.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 break-words font-pixel text-xl leading-tight text-silver-100">
                    {r.title}
                  </span>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setConverting(r)}
                      className="cv-btn cv-btn--gold px-2 py-0.5 text-sm"
                    >
                      Crear tarea
                    </button>
                    <button
                      type="button"
                      onClick={() => void archive(r.id)}
                      className="cv-btn cv-btn--ghost px-2 py-0.5 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}

export default RemindersPanel

