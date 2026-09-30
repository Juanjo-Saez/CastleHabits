import { useState } from 'react'
import HabitCard from '../components/HabitCard'
import NewHabitForm from '../components/NewHabitForm'
import PageHeader from '../components/PageHeader'
import { useItemsStore } from '../store/useItemsStore'

function HabitsPage() {
  const items = useItemsStore((s) => s.items)
  const loading = useItemsStore((s) => s.loading)
  const [showForm, setShowForm] = useState(false)

  const habits = items.filter((i) => i.type === 'habit' && !i.archived)

  return (
    <div>
      <PageHeader title="Rituales Diarios" subtitle="Los hábitos que alimentan tu fuerza" />

      <div className="flex justify-end px-5 pb-3">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="font-heading text-xs tracking-wide text-gold-400 hover:text-gold-300"
        >
          {showForm ? 'Cerrar' : '+ Nuevo ritual'}
        </button>
      </div>

      {showForm && <NewHabitForm onClose={() => setShowForm(false)} />}

      {!loading && habits.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-parchment-500">
          <span className="text-3xl">🕯️</span>
          <p className="font-body italic">
            Aún no hay rituales grabados en el grimorio. Invoca el primero.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 px-5 pb-4">
        {habits.map((item) => (
          <HabitCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

export default HabitsPage
