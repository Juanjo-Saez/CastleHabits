import { useState } from 'react'
import EmptyState from '../components/EmptyState'
import ItemCard from '../components/ItemCard'
import NewTaskForm from '../components/NewTaskForm'
import PageHeader from '../components/PageHeader'
import SectionTitle from '../components/SectionTitle'
import SortPicker from '../components/SortPicker'
import { todayKey } from '../lib/date'
import { isItemDueOn, isTodoClosedBefore } from '../lib/recurrence'
import { sortTasks, type TaskSortKey } from '../lib/taskSort'
import { useItemsStore } from '../store/useItemsStore'

function ChoresPage() {
  const items = useItemsStore((s) => s.items)
  const completionsByItem = useItemsStore((s) => s.completionsByItem)
  const loading = useItemsStore((s) => s.loading)
  const [showForm, setShowForm] = useState(false)
  const [sortKey, setSortKey] = useState<TaskSortKey>('difficulty')

  const today = new Date()
  const key = todayKey()
  const active = items.filter((item) => !item.archived)
  const dueToday = sortTasks(
    active.filter((item) => item.type === 'chore' && isItemDueOn(item, today)),
    sortKey,
  )
  const scrolls = sortTasks(
    active.filter(
      (item) =>
        item.type === 'todo' && !isTodoClosedBefore(item, completionsByItem[item.id] ?? [], key),
    ),
    sortKey,
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
          Hoy en el castillo
        </SectionTitle>

        {showForm && <NewTaskForm onClose={() => setShowForm(false)} />}

        <SortPicker value={sortKey} onChange={setSortKey} />

        {loading ? (
          <p className="py-8 text-center font-pixel text-xl text-silver-500">Cargando grimorio...</p>
        ) : (
          <>
            {dueToday.length === 0 ? (
              <EmptyState icon={<span className="text-4xl">🏰</span>}>
                Nada te reclama hoy. Consulta el calendario para planificar lo que viene.
              </EmptyState>
            ) : (
              <div className="flex flex-col gap-2">
                {dueToday.map((item) => <ItemCard key={item.id} item={item} />)}
              </div>
            )}

            <SectionTitle>Pergaminos</SectionTitle>
            {scrolls.length === 0 ? (
              <p className="py-2 text-center font-pixel text-lg text-silver-700">
                — SIN PERGAMINOS PENDIENTES —
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {scrolls.map((item) => <ItemCard key={item.id} item={item} />)}
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}

export default ChoresPage