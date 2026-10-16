import { useState } from 'react'
import { useRemindersStore } from '../store/useRemindersStore'

function NewReminderForm() {
  const addReminder = useRemindersStore((s) => s.addReminder)
  const [title, setTitle] = useState('')

  const canSubmit = Boolean(title.trim())

  const handleSubmit = async () => {
    if (!canSubmit) return
    await addReminder(title.trim())
    setTitle('')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void handleSubmit()
      }}
      className="flex gap-2"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Limpiar la air fryer, cambiar el filtro..."
        aria-label="Nuevo pendiente"
        className="cv-input min-w-0 flex-1"
      />
      <button type="submit" disabled={!canSubmit} className="cv-btn cv-btn--gold">
        Añadir
      </button>
    </form>
  )
}

export default NewReminderForm
