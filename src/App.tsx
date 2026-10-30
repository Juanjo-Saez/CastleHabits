import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import Backdrop from './components/Backdrop'
import DailySummaryModal from './components/DailySummaryModal'
import HardcoreDeath from './components/HardcoreDeath'
import LevelUpCelebration from './components/LevelUpCelebration'
import { settleDayPenalties } from './lib/dayCorrections'
import { todayKey } from './lib/date'
import {
  countPendingToday,
  getNotificationPermission,
  hasRemindedToday,
  markRemindedToday,
  showReminder,
} from './lib/notifications'
import CalendarPage from './pages/CalendarPage'
import ChoresPage from './pages/ChoresPage'
import FailureHistoryPage from './pages/FailureHistoryPage'
import HabitsPage from './pages/HabitsPage'
import TaskArchivePage from './pages/TaskArchivePage'
import ProfilePage from './pages/ProfilePage'
import StatsPage from './pages/StatsPage'
import { useAchievementsStore } from './store/useAchievementsStore'
import { useBossStore } from './store/useBossStore'
import { useDailySummaryStore } from './store/useDailySummaryStore'
import { useItemsStore } from './store/useItemsStore'
import { usePlayerStore } from './store/usePlayerStore'
import { useRemindersStore } from './store/useRemindersStore'
import { useRewardsStore } from './store/useRewardsStore'
import { useSkyViewStore } from './store/useSkyViewStore'

const tabs = [
  { to: '/habitos', label: 'Hábitos', icon: '🕯️', end: true },
  { to: '/tareas', label: 'Castillo', icon: '🏰' },
  { to: '/calendario', label: 'Calendario', icon: '🗓️' },
  { to: '/stats', label: 'Crónicas', icon: '📜' },
  { to: '/perfil', label: 'Cazador', icon: '🧛' },
]

function App() {
  const location = useLocation()
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const contemplating = useSkyViewStore((s) => s.contemplating)
  const loadItems = useItemsStore((s) => s.load)
  const loadPlayer = usePlayerStore((s) => s.load)
  const loadAchievements = useAchievementsStore((s) => s.load)
  const loadRewards = useRewardsStore((s) => s.load)
  const loadReminders = useRemindersStore((s) => s.load)

  useEffect(() => {
    let active = true
    let checkedDay = ''
    const refresh = async () => {
      try {
        await Promise.all([
          loadItems(),
          loadPlayer(),
          loadAchievements(),
          loadRewards(),
          loadReminders(),
        ])

        await settleDayPenalties()
        await loadPlayer()
        await useBossStore.getState().sync()
        const { items, completionsByItem } = useItemsStore.getState()
        await usePlayerStore.getState().evaluateRoutes(items, completionsByItem)

        const profile = usePlayerStore.getState().profile
        if (profile) await useAchievementsStore.getState().checkAndUnlock({ items, completionsByItem, profile })
        checkedDay = todayKey()
        if (active) {
          setLoadError(null)
          // El resumen se decide antes de mostrar la página para que ningún aviso se superponga.
          await useDailySummaryStore.getState().presentIfDue()
          if (active) setReady(true)
        }
      } catch (cause) {
        if (active) setLoadError(cause instanceof Error ? cause.message : 'No se pudieron cargar los datos.')
      }
    }
    let refreshing = false
    const checkDay = async () => {
      if (refreshing || checkedDay === todayKey()) return
      refreshing = true
      try {
        await refresh()
      } finally {
        refreshing = false
      }
    }
    void checkDay()
    const timer = window.setInterval(() => void checkDay(), 30_000)
    const onVisible = () => { if (!document.hidden) void checkDay() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loadItems, loadPlayer, loadAchievements, loadRewards, loadReminders])

  useEffect(() => {
    const checkReminder = async () => {
      const { items, completionsByItem } = useItemsStore.getState()
      if (getNotificationPermission() === 'granted' && !hasRemindedToday()) {
        const pending = countPendingToday(items, completionsByItem)
        if (pending > 0) {
          await showReminder(pending)
          markRemindedToday()
        }
      }
    }

    void checkReminder()
    const interval = setInterval(() => void checkReminder(), 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative mx-auto flex h-full max-w-md flex-col border-x border-gold-600/30 bg-transparent">
      <Backdrop />
      <LevelUpCelebration />
      <DailySummaryModal />
      <HardcoreDeath />
      <main className={`relative z-10 flex-1 overflow-y-auto pb-20 ${location.pathname === '/tareas' ? 'cv-castle-scroll' : ''}`}>
        {loadError && <p role="alert" className="p-3 font-body text-blood-400">No se pudo actualizar el día: {loadError}. Recarga para volver a intentarlo.</p>}
        {!ready && !loadError && <p role="status" className="p-3 font-body text-silver-400">Cargando grimorio…</p>}
        {ready && (
          <Routes>
            <Route path="/" element={<Navigate to="/tareas" replace />} />
            <Route path="/habitos" element={<HabitsPage />} />
            <Route path="/tareas" element={<ChoresPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/archivo" element={<TaskArchivePage />} />
            <Route path="/historial" element={<FailureHistoryPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
          </Routes>
        )}
      </main>

      <nav
        aria-hidden={contemplating}
        inert={contemplating}
        className={`fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md border-t border-gold-600/40 bg-crypt-950/95 backdrop-blur transition-transform duration-300 ${contemplating ? 'translate-y-full' : ''}`}
      >
        <div className="ornate-divider absolute inset-x-0 top-0" />
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-heading tracking-wide transition-colors ${
                isActive ? 'text-gold-400' : 'text-parchment-500'
              }`
            }
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default App
