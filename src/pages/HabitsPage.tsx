import { useState } from 'react'
import EmptyState from '../components/EmptyState'
import ItemCard from '../components/ItemCard'
import ItemDetails from '../components/ItemDetails'
import NewHabitForm from '../components/NewHabitForm'
import PageHeader from '../components/PageHeader'
import SectionTitle from '../components/SectionTitle'
import { sortTasks } from '../lib/taskSort'
import { ROUTE_IDS, ROUTES } from '../lib/routes'
import { useItemsStore } from '../store/useItemsStore'
import { usePlayerStore } from '../store/usePlayerStore'
import type { Item, RouteId } from '../types'

function inferLegacyRoute(item: Item, startedRoutes: RouteId[]): RouteId | undefined {
  if (item.routeId && ROUTES[item.routeId]) return item.routeId

  const matches = startedRoutes.filter((routeId) =>
    ROUTES[routeId].activities.some((activity) =>
      activity.title === item.title &&
      activity.difficulty === item.difficulty &&
      activity.trackingType === item.trackingType &&
      activity.quantityGoal === item.quantityGoal &&
      activity.unit === item.unit,
    ),
  )
  return matches.length === 1 ? matches[0] : undefined
}

function routeAccent(routeId: RouteId): string {
  switch (routeId) {
    case 'vampire-hunter': return 'border-blood-500 text-blood-300'
    case 'technomancer': return 'border-arcane-400 text-arcane-300'
    case 'castle-within': return 'border-gold-400 text-gold-300'
  }
}

function HabitsPage() {
  const items = useItemsStore((s) => s.items)
  const loading = useItemsStore((s) => s.loading)
  const routes = usePlayerStore((s) => s.profile?.routes)
  const [showForm, setShowForm] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(ROUTE_IDS),
  )
  const selectedItem = items.find((item) => item.id === selectedItemId && !item.archived)
  const habits = sortTasks(
    items.filter((item) => item.type === 'habit' && !item.archived),
    'difficulty',
  )
  const startedRoutes = ROUTE_IDS.filter((routeId) => Boolean(routes?.[routeId]?.windowStart))
  const routeByHabit = new Map(
    habits.map((item) => [item.id, inferLegacyRoute(item, startedRoutes)]),
  )
  const groups = [
    ...ROUTE_IDS.map((routeId) => ({
      id: routeId,
      title: `${ROUTES[routeId].icon} ${ROUTES[routeId].name}`,
      accent: routeAccent(routeId),
      items: habits.filter((item) => routeByHabit.get(item.id) === routeId),
    })).filter((group) => group.items.length > 0),
    {
      id: 'unassigned',
      title: 'Hábitos',
      accent: 'border-silver-500 text-silver-300',
      items: habits.filter((item) => !routeByHabit.get(item.id)),
    },
  ].filter((group) => group.items.length > 0)
  const showEmpty = !loading && groups.length === 0
  const showGroups = !loading && groups.length > 0

  return (
    <>
      <PageHeader title="Misiones" subtitle="Mejora tu poder sin convertirlo en una deuda." />
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
          Misiones secundarias
        </SectionTitle>

        {showForm && <NewHabitForm onClose={() => setShowForm(false)} />}

        {loading && (
          <p className="py-8 text-center font-pixel text-xl text-silver-500">Cargando grimorio...</p>
        )}
        {showEmpty && (
          <EmptyState icon={<span className="text-4xl">🕯️</span>}>
            No hay misiones secundarias. Añade ejercicio, lectura u ocio para ganar recompensas.
          </EmptyState>
        )}
        {showGroups && (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <section key={group.id} className="flex flex-col gap-2">
                <h3 className="m-0">
                  <button
                    id={`habit-group-${group.id}`}
                    type="button"
                    aria-expanded={!collapsedGroups.has(group.id)}
                    aria-controls={`habit-items-${group.id}`}
                    onClick={() => setCollapsedGroups((current) => {
                      const next = new Set(current)
                      if (next.has(group.id)) next.delete(group.id)
                      else next.add(group.id)
                      return next
                    })}
                    className={`flex w-full items-center gap-3 border-l-4 bg-night-900/80 px-3 py-2 text-left font-pixel text-xl leading-none ${group.accent}`}
                  >
                    <span className="min-w-0 flex-1">{group.title}</span>
                    <span className="text-base" aria-hidden="true">
                      {collapsedGroups.has(group.id) ? '＋' : '−'}
                    </span>
                  </button>
                </h3>
                <div
                  id={`habit-items-${group.id}`}
                  hidden={collapsedGroups.has(group.id)}
                  className="flex flex-col gap-2"
                >
                  {group.items.map((item) => (
                    <ItemCard key={item.id} item={item} onOpen={() => setSelectedItemId(item.id)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
      {selectedItem && <ItemDetails item={selectedItem} onClose={() => setSelectedItemId(null)} />}
    </>
  )
}

export default HabitsPage