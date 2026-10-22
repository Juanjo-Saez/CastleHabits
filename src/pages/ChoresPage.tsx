import { addDays, format } from 'date-fns'
import { useState } from 'react'
import EmptyState from '../components/EmptyState'
import ItemCard from '../components/ItemCard'
import ItemDetails from '../components/ItemDetails'
import NewTaskForm from '../components/NewTaskForm'
import PageHeader from '../components/PageHeader'
import RecentMissesPanel from '../components/RecentMissesPanel'
import RemindersPanel from '../components/RemindersPanel'
import SectionTitle from '../components/SectionTitle'
import SortPicker from '../components/SortPicker'
import TomorrowPanel from '../components/TomorrowPanel'
import { logicalNow, todayKey } from '../lib/date'
import {
  isItemDueOn,
  isTodoClosedBefore,
  isWindowCompleted,
  isWindowDoneBefore,
  missedCarryOf,
} from '../lib/recurrence'
import { sortTasks, type TaskSortKey } from '../lib/taskSort'
import { useItemsStore } from '../store/useItemsStore'

function ChoresPage() {
  const items = useItemsStore((s) => s.items)
  const completionsByItem = useItemsStore((s) => s.completionsByItem)
  const loading = useItemsStore((s) => s.loading)
  const [showForm, setShowForm] = useState(false)
  const [sortKey, setSortKey] = useState<TaskSortKey>('difficulty')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const selectedItem = items.find((item) => item.id === selectedItemId && !item.archived)

  const today = logicalNow()
  const key = todayKey()
  const tomorrow = addDays(today, 1)
  const tomorrowKey = format(tomorrow, 'yyyy-MM-dd')
  const active = items.filter((item) => !item.archived)
  // Una tarea con margen cumplida en un día anterior de su ventana deja de aparecer hasta su siguiente vez.
  // Una obligación fallada sigue pendiente hoy hasta cumplirla una vez.
  const dueToday = sortTasks(
    active.filter((item) => {
      if (item.type !== 'chore') return false
      const history = completionsByItem[item.id] ?? []
      return (
        (isItemDueOn(item, today) || missedCarryOf(item, history, key) !== null) &&
        !isWindowDoneBefore(item, history, key)
      )
    }),
    sortKey,
  )
  const dueTomorrow = sortTasks(
    active.filter((item) => {
      const history = completionsByItem[item.id] ?? []
      if (item.type === 'chore') {
        return isItemDueOn(item, tomorrow) && !isWindowCompleted(item, history, tomorrowKey)
      }
      return (
        item.type === 'todo' &&
        (item.postponedUntil ?? item.dueDate) === tomorrowKey &&
        !isTodoClosedBefore(item, history, tomorrowKey)
      )
    }),
    sortKey,
  )
  const scrolls = sortTasks(
    active.filter(
      (item) =>
        item.type === 'todo' &&
        (!item.startDate || item.startDate <= key) &&
        !isTodoClosedBefore(item, completionsByItem[item.id] ?? [], key),
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
                {dueToday.map((item) => (
                  <ItemCard key={item.id} item={item} onOpen={() => setSelectedItemId(item.id)} />
                ))}
              </div>
            )}

            <SectionTitle>Pergaminos</SectionTitle>
            {scrolls.length === 0 ? (
              <p className="py-2 text-center font-pixel text-lg text-silver-700">
                — SIN PERGAMINOS PENDIENTES —
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {scrolls.map((item) => (
                  <ItemCard key={item.id} item={item} onOpen={() => setSelectedItemId(item.id)} />
                ))}
              </div>
            )}

            <RemindersPanel />
            <RecentMissesPanel />
            <TomorrowPanel items={dueTomorrow} />
          </>
        )}
      </section>
      {selectedItem && <ItemDetails item={selectedItem} onClose={() => setSelectedItemId(null)} />}
    </>
  )
}

export default ChoresPage