import { useMemo, useState } from 'react'
import NewTaskForm from '../components/NewTaskForm'
import PageHeader from '../components/PageHeader'
import TaskCard from '../components/TaskCard'
import { useItemsStore } from '../store/useItemsStore'

const UNZONED = 'Otras estancias'

function ChoresPage() {
  const items = useItemsStore((s) => s.items)
  const loading = useItemsStore((s) => s.loading)
  const [showForm, setShowForm] = useState(false)

  const chores = items.filter((i) => i.type === 'chore' && !i.archived)
  const todos = items
    .filter((i) => i.type === 'todo' && !i.archived)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))

  const choresByZone = useMemo(() => {
    const groups = new Map<string, typeof chores>()
    for (const chore of chores) {
      const zone = chore.zone?.trim() || UNZONED
      groups.set(zone, [...(groups.get(zone) ?? []), chore])
    }
    return groups
  }, [chores])

  const isEmpty = !loading && chores.length === 0 && todos.length === 0

  return (
    <div>
      <PageHeader
        title="El Castillo"
        subtitle="Mantén a raya la decadencia, estancia por estancia"
      />

      <div className="flex justify-end px-5 pb-3">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="font-heading text-xs tracking-wide text-gold-400 hover:text-gold-300"
        >
          {showForm ? 'Cerrar' : '+ Nueva tarea'}
        </button>
      </div>

      {showForm && <NewTaskForm onClose={() => setShowForm(false)} />}

      {isEmpty && !showForm && (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-parchment-500">
          <span className="text-3xl">🏰</span>
          <p className="font-body italic">
            El castillo aún no tiene estancias registradas. Añade la primera
            tarea.
          </p>
        </div>
      )}

      {todos.length > 0 && (
        <section className="px-5 pb-4">
          <h2 className="mb-2 font-heading text-xs tracking-widest text-parchment-500 uppercase">
            Pergaminos pendientes
          </h2>
          <div className="flex flex-col gap-2">
            {todos.map((item) => (
              <TaskCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {[...choresByZone.entries()].map(([zone, zoneChores]) => (
        <section key={zone} className="px-5 pb-4">
          <h2 className="mb-2 font-heading text-xs tracking-widest text-parchment-500 uppercase">
            {zone}
          </h2>
          <div className="flex flex-col gap-2">
            {zoneChores.map((item) => (
              <TaskCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default ChoresPage
