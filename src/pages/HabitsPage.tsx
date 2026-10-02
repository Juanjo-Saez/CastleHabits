import { useState } from 'react'
import EmptyState from '../components/EmptyState'
import ItemCard from '../components/ItemCard'
import NewHabitForm from '../components/NewHabitForm'
import PageHeader from '../components/PageHeader'
import SectionTitle from '../components/SectionTitle'
import { useItemsStore } from '../store/useItemsStore'

function HabitsPage() {
  const items = useItemsStore((s) => s.items)
  const loading = useItemsStore((s) => s.loading)
  const [showForm, setShowForm] = useState(false)
  const habits = items.filter((item) => item.type === 'habit' && !item.archived)

  return (
    <>
      <PageHeader title="Rituales" subtitle="Enciende la vela y mantén tu pacto." />
      <section className="relative z-10 flex flex-col gap-3 px-3">
        <SectionTitle
          action={
            <button
              type="button"
              onClick={() => setShowForm((visible) => !visible)}
              className="cv-btn cv-btn--gold px-2 py-1 text-base"
            >
              {showForm ? 'Cerrar' : '+ Nuevo'}
            </button>
          }
        >
          Hábitos diarios
        </SectionTitle>

        {showForm && <NewHabitForm onClose={() => setShowForm(false)} />}

        {loading ? (
          <p className="py-8 text-center font-pixel text-xl text-silver-500">Cargando grimorio...</p>
        ) : habits.length === 0 ? (
          <EmptyState icon={<span className="text-4xl">🕯️</span>}>
            No hay rituales. Añade un hábito para comenzar tu cacería diaria.
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {habits.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        )}
      </section>
    </>
  )
}

export default HabitsPage