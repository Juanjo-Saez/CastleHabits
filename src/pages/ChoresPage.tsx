import { addDays, format } from 'date-fns'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import {
  bossEntranceToken,
  isBossEntrancePending,
  markBossEntranceSeen,
} from '../lib/bossEntranceMarker'
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
  const [bossResultPending, setBossResultPending] = useState(false)
  const [bossEntrancePhase, setBossEntrancePhase] = useState<'revealing' | null>(null)
  const resultPendingRef = useRef(bossResultPending)
  const skyRef = useRef<HTMLDivElement>(null)
  const selectedItem = items.find((item) => item.id === selectedItemId && !item.archived)

  useEffect(() => {
    resultPendingRef.current = bossResultPending
  }, [bossResultPending])

  // La página arranca bajo el cielo; desplazarla hacia arriba lo deja ver sin HUD ni navegación.
  useLayoutEffect(() => {
    const sky = skyRef.current
    const scroller = sky?.closest('main')
    if (!sky || !scroller) return
    scroller.scrollTop = sky.offsetHeight
    let lockedWheelDirection = 0
    let wheelUnlockTimer = 0
    let lastTouchY: number | null = null
    let touchLocked = false

    const onScroll = () => {
      useSkyViewStore.getState().setContemplating(scroller.scrollTop < sky.offsetHeight * 0.5)
    }
    const isNestedScroller = (target: EventTarget | null) => {
      let element = target instanceof Element ? target : null
      while (element && element !== scroller) {
        const style = window.getComputedStyle(element)
        if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight) return true
        element = element.parentElement
      }
      return false
    }
    const resetWheelLock = () => {
      window.clearTimeout(wheelUnlockTimer)
      wheelUnlockTimer = window.setTimeout(() => { lockedWheelDirection = 0 }, 220)
    }
    const stopWheel = (event: WheelEvent, target: number) => {
      event.preventDefault()
      scroller.scrollTop = target
      lockedWheelDirection = -1
      resetWheelLock()
    }
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY >= 0 || isNestedScroller(event.target)) {
        if (event.deltaY > 0 && lockedWheelDirection) {
          window.clearTimeout(wheelUnlockTimer)
          lockedWheelDirection = 0
        }
        return
      }
      if (lockedWheelDirection) {
        event.preventDefault()
        resetWheelLock()
        return
      }

      const delta = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? scroller.clientHeight : 1)
      const taskStop = sky.offsetHeight
      if (scroller.scrollTop > taskStop && scroller.scrollTop + delta <= taskStop) {
        stopWheel(event, taskStop)
      } else if (scroller.scrollTop > 0 && scroller.scrollTop + delta <= 0) {
        stopWheel(event, 0)
      }
    }
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      lastTouchY = event.touches[0].clientY
      touchLocked = false
    }
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1 || isNestedScroller(event.target)) return
      if (touchLocked) {
        event.preventDefault()
        return
      }
      const currentY = event.touches[0].clientY
      const delta = (lastTouchY ?? currentY) - currentY
      lastTouchY = currentY
      if (delta >= 0) return

      const taskStop = sky.offsetHeight
      if (scroller.scrollTop > taskStop && scroller.scrollTop + delta <= taskStop) {
        event.preventDefault()
        scroller.scrollTop = taskStop
        touchLocked = true
      } else if (scroller.scrollTop > 0 && scroller.scrollTop + delta <= 0) {
        event.preventDefault()
        scroller.scrollTop = 0
        touchLocked = true
      }
    }
    const onTouchEnd = () => {
      lastTouchY = null
      touchLocked = false
    }

    scroller.addEventListener('scroll', onScroll, { passive: true })
    scroller.addEventListener('wheel', onWheel, { passive: false })
    scroller.addEventListener('touchstart', onTouchStart, { passive: true })
    scroller.addEventListener('touchmove', onTouchMove, { passive: false })
    scroller.addEventListener('touchend', onTouchEnd, { passive: true })
    scroller.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      scroller.removeEventListener('wheel', onWheel)
      scroller.removeEventListener('touchstart', onTouchStart)
      scroller.removeEventListener('touchmove', onTouchMove)
      scroller.removeEventListener('touchend', onTouchEnd)
      scroller.removeEventListener('touchcancel', onTouchEnd)
      window.clearTimeout(wheelUnlockTimer)
      useSkyViewStore.getState().setContemplating(false)
      scroller.scrollTop = 0
    }
  }, [])

  const scrollSky = useCallback((top: 'sky' | 'tasks') => {
    const sky = skyRef.current
    const scroller = sky?.closest('main')
    if (!sky || !scroller) return
    scroller.scrollTo({
      top: top === 'sky' ? 0 : sky.offsetHeight,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }, [])

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
  const activeBossToken = bossEncounter ? bossEntranceToken(bossEncounter) : null

  useEffect(() => {
    if (!bossEncounter || !activeBossToken || !isBossEntrancePending(bossEncounter)) {
      return
    }

    let cancelled = false
    let revealTimer = 0
    const launchTimer = window.setTimeout(() => {
      if (cancelled || resultPendingRef.current) return
      scrollSky('sky')
      if (prefersReducedMotion()) {
        markBossEntranceSeen(activeBossToken)
        return
      }
      setBossEntrancePhase('revealing')
      revealTimer = window.setTimeout(() => {
        if (cancelled || resultPendingRef.current) return
        markBossEntranceSeen(activeBossToken)
        setBossEntrancePhase(null)
      }, 1900)
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(launchTimer)
      window.clearTimeout(revealTimer)
      setBossEntrancePhase(null)
    }
  }, [activeBossToken, bossEncounter, scrollSky])

  return (
    <>
      <BossSky
        ref={skyRef}
        bossId={bossEncounter?.bossId ?? null}
        onOpenBoss={() => setBossOpen(true)}
        onReturn={() => scrollSky('tasks')}
        entrancePhase={bossEntrancePhase ?? undefined}
        onSkipEntrance={() => {
          if (!activeBossToken) return
          markBossEntranceSeen(activeBossToken)
          setBossEntrancePhase(null)
        }}
      />
      <div className="cv-castle-snap-stop min-h-[calc(100dvh-5rem)]">
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
      <BossAnnouncement onResultPendingChange={setBossResultPending} />
    </>
  )
}

export default ChoresPage