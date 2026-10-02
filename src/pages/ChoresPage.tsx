import { useState } from 'react'
import EmptyState from '../components/EmptyState'
import ItemCard from '../components/ItemCard'
import NewTaskForm from '../components/NewTaskForm'
import PageHeader from '../components/PageHeader'
import SectionTitle from '../components/SectionTitle'
import { useItemsStore } from '../store/useItemsStore'

function ChoresPage() {
  const items = useItemsStore((s) => s.items)
  const loading = useItemsStore((s) => s.loading)
  const [showForm, setShowForm] = useState(false)
  const tasks = items.filter(
    (item) => (item.type === 'chore' || item.type === 'todo') && !item.archived,
  )

  return (
    <>
      <PageHeader title="El Castillo" subtitle="Cada estancia guarda una tarea pendiente." />
      <section className="relative z-10 flex flex-col gap-3 px-3">
        <SectionTitle
          action={
            <button
              type="button"
              onClick={() => setShowForm((visible) => !visible)}
              className="cv-btn cv-btn--gold px-2 py-1 text-base"
            >
              {showForm ? 'Cerrar' : '+ Nueva'}
            </button>
          }
        >
          Tareas del castillo
        </SectionTitle>

        {showForm && <NewTaskForm onClose={() => setShowForm(false)} />}

        {loading ? (
          <p className="py-8 text-center font-pixel text-xl text-silver-500">Cargando grimorio...</p>
        ) : tasks.length === 0 ? (
          <EmptyState icon={<span className="text-4xl">🏰</span>}>
            El castillo está en calma. Añade una tarea recurrente o un pergamino puntual.
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        )}
      </section>
    </>
  )
}

export default ChoresPage