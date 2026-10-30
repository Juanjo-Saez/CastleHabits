import { addDays, format } from 'date-fns'
import { useLayoutEffect, useRef, useState } from 'react'
import BossAnnouncement from '../components/BossAnnouncement'
import BossBanner from '../components/BossBanner'
import BossDialog from '../components/BossDialog'
import { chooseDeathStake } from '../store/useBossStore'
import BossSky from '../components/BossSky'
import CurseBadges from '../components/CurseBadges'
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
import { activeEncounter, BOSSES, hidesTomorrow, summarizeBoss } from '../lib/bosses'
import { logicalNow, todayKey } from '../lib/date'
import {
  isItemDueOn,
  isTodoClosedBefore,
  isWindowCompleted,
  isWindowDoneBefore,
  missedCarryOf,
} from '../lib/recurrence'
import { sortTasks, type TaskSortKey } from '../lib/taskSort'
import { useBossStore } from '../store/useBossStore'
import { useItemsStore } from '../store/useItemsStore'
import { useSkyViewStore } from '../store/useSkyViewStore'

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function ChoresPage() {
  const items = useItemsStore((s) => s.items)
  const completionsByItem = useItemsStore((s) => s.completionsByItem)
  const loading = useItemsStore((s) => s.loading)
  const encounters = useBossStore((s) => s.encounters)
  const [showForm, setShowForm] = useState(false)
  const [sortKey, setSortKey] = useState<TaskSortKey>('difficulty')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [bossOpen, setBossOpen] = useState(false)
  const skyRef = useRef<HTMLDivElement>(null)
  const selectedItem = items.find((item) => item.id === selectedItemId && !item.archived)

  // La página arranca bajo el cielo; desplazarla hacia arriba lo deja ver sin HUD ni navegación.
  useLayoutEffect(() => {
    const sky = skyRef.current
    const scroller = sky?.closest('main')
    if (!sky || !scroller) return
    scroller.scrollTop = sky.offsetHeight
    const onScroll = () => {
      useSkyViewStore.getState().setContemplating(scroller.scrollTop < sky.offsetHeight * 0.5)
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      useSkyViewStore.getState().setContemplating(false)
      scroller.scrollTop = 0
    }
  }, [])

  const scrollSky = (top: 'sky' | 'tasks') => {
    const sky = skyRef.current
    const scroller = sky?.closest('main')
    if (!sky || !scroller) return
    scroller.scrollTo({
      top: top === 'sky' ? 0 : sky.offsetHeight,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }

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

  const bossEncounter = activeEncounter(encounters)
  const bossSummary = bossEncounter ? summarizeBoss(bossEncounter, items, completionsByItem, key) : null

  return (
    <>
      <BossSky
        ref={skyRef}
        bossId={bossEncounter?.bossId ?? null}
        onOpenBoss={() => setBossOpen(true)}
        onReturn={() => scrollSky('tasks')}
      />
      <div className="min-h-[calc(100dvh-5rem)]">
        <PageHeader title="El Castillo" subtitle="Cada estancia guarda una tarea pendiente." />
        <section className="relative z-10 flex flex-col gap-3 px-3">
          <button
            type="button"
            onClick={() => scrollSky('sky')}
            className="cv-btn cv-btn--ghost self-center bg-night-950/70 px-2 py-1 text-base"
          >
            🌙 Contemplar el castillo
          </button>
          <CurseBadges />
          {bossSummary && <BossBanner summary={bossSummary} onOpen={() => setBossOpen(true)} />}

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
              {(!bossEncounter || !hidesTomorrow(BOSSES[bossEncounter.bossId])) && (
                <TomorrowPanel items={dueTomorrow} />
              )}
            </>
          )}
        </section>
      </div>
      {selectedItem && <ItemDetails item={selectedItem} onClose={() => setSelectedItemId(null)} />}
      {bossOpen && bossSummary && (
        <BossDialog summary={bossSummary} onClose={() => setBossOpen(false)} onDeathStake={chooseDeathStake} />
      )}
      <BossAnnouncement />
    </>
  )
}

export default ChoresPage