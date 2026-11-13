import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Backdrop from './components/Backdrop'
import DailySummaryModal from './components/DailySummaryModal'
import GuidedTutorial from './components/GuidedTutorial'
import HardcoreDeath from './components/HardcoreDeath'
import LevelUpCelebration from './components/LevelUpCelebration'
import OnboardingFlow from './components/OnboardingFlow'
import SoulLoadoutModal from './components/SoulLoadoutModal'
import {
  getOnboardingStartupState,
  markOnboardingHandled,
  type OnboardingStartupState,
} from './db/database'
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
import BestiaryPage from './pages/BestiaryPage'
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

const tabs: { to: string; label: string; compactLabel: string; icon: string; end?: boolean }[] = [
  { to: '/habitos', label: 'Hábitos', compactLabel: 'Háb.', icon: '🕯️', end: true },
  { to: '/tareas', label: 'Tareas', compactLabel: 'Tareas', icon: '🏰' },
  { to: '/calendario', label: 'Calendario', compactLabel: 'Cal.', icon: '🗓️' },
  { to: '/bestiario', label: 'Bestiario', compactLabel: 'Best.', icon: '📖' },
  { to: '/stats', label: 'Progreso', compactLabel: 'Progr.', icon: '📜' },
  { to: '/perfil', label: 'Perfil', compactLabel: 'Perfil', icon: '🧛' },
]

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [onboardingMode, setOnboardingMode] = useState<OnboardingStartupState | 'plan'>(null)
  const [openNewTaskForm, setOpenNewTaskForm] = useState(false)
  const contemplating = useSkyViewStore((s) => s.contemplating)
  const loadItems = useItemsStore((s) => s.load)
  const loadPlayer = usePlayerStore((s) => s.load)
  const loadAchievements = useAchievementsStore((s) => s.load)
  const loadRewards = useRewardsStore((s) => s.load)
  const loadReminders = useRemindersStore((s) => s.load)
  const profile = usePlayerStore((s) => s.profile)

  useEffect(() => {
    let active = true
    let checkedDay = ''
    const refresh = async () => {
      try {
        const startupState = await getOnboardingStartupState()
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
        await usePlayerStore.getState().ensureDailySoulLoadout()
        checkedDay = todayKey()
        if (active) {
          setLoadError(null)
          setOnboardingMode((current) => current ?? startupState)
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

  const finishTutorial = async (action: 'close' | 'plan' | 'task') => {
    try {
      await markOnboardingHandled()
      if (action === 'plan') {
        setOnboardingMode('plan')
      } else {
        setOnboardingMode(null)
      }
      if (action === 'task') {
        setOpenNewTaskForm(true)
        navigate('/tareas')
      }
    } catch (cause) {
      setLoadError(cause instanceof Error
        ? `No se pudo guardar el estado del onboarding: ${cause.message}`
        : 'No se pudo guardar el estado del onboarding.')
    }
  }

  const appRoutes = (
    <Routes>
      <Route path="/" element={<Navigate to="/tareas" replace />} />
      <Route
        path="/habitos"
        element={<HabitsPage />}
      />
      <Route
        path="/tareas"
        element={
          <ChoresPage
            openNewTask={openNewTaskForm}
            onNewTaskRequestHandled={() => setOpenNewTaskForm(false)}
          />
        }
      />
      <Route path="/calendario" element={<CalendarPage />} />
      <Route path="/bestiario" element={<BestiaryPage />} />
      <Route path="/archivo" element={<TaskArchivePage />} />
      <Route path="/historial" element={<FailureHistoryPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route
        path="/perfil"
        element={
          <ProfilePage
            onReplayTutorial={() => setOnboardingMode('tutorial')}
            onOpenHabitPlanner={() => setOnboardingMode('plan')}
          />
        }
      />
    </Routes>
  )

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
      <SoulLoadoutModal />
      <HardcoreDeath />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-crypt-950 focus:px-4 focus:py-3 focus:text-gold-200">
        Saltar al contenido
      </a>
      <main
        id="main-content"
        tabIndex={-1}
        className={`relative z-10 flex-1 overflow-y-auto ${onboardingMode ? '' : 'pb-20'} ${location.pathname === '/tareas' ? 'cv-castle-scroll' : ''}`}
      >
        {loadError && <p role="alert" className="p-3 font-body text-blood-400">Se produjo un error: {loadError}. Recarga la aplicación para volver a intentarlo.</p>}
        {!ready && !loadError && <p role="status" className="p-3 font-body text-silver-400">Cargando grimorio…</p>}
        {ready && (
          onboardingMode === 'plan' ? (
            <OnboardingFlow
              onClose={() => setOnboardingMode(null)}
              onGoToHabits={() => {
                navigate('/habitos')
                setOnboardingMode(null)
              }}
            />
          ) : (
            <>
              <div aria-hidden={onboardingMode === 'tutorial'} inert={onboardingMode === 'tutorial'}>
                {appRoutes}
              </div>
              {onboardingMode === 'tutorial' && profile && (
                <GuidedTutorial
                  profile={profile}
                  onExit={() => void finishTutorial('close')}
                  onCreateTask={() => void finishTutorial('task')}
                  onCreatePlan={() => void finishTutorial('plan')}
                />
              )}
            </>
          )
        )}
      </main>

      <nav
        aria-hidden={contemplating || onboardingMode !== null}
        inert={contemplating || onboardingMode !== null}
        hidden={onboardingMode !== null}
        className={`fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md border-t border-gold-600/40 bg-crypt-950/95 backdrop-blur transition-transform duration-300 ${contemplating || onboardingMode ? 'translate-y-full' : ''}`}
      >
        <div className="ornate-divider absolute inset-x-0 top-0" />
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            aria-label={tab.label}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-1 py-2.5 text-xs font-heading tracking-wide transition-colors ${
                isActive ? 'text-gold-400' : 'text-parchment-500'
              }`
            }
          >
            <span aria-hidden="true" className="text-lg leading-none">{tab.icon}</span>
            <span className="hidden min-[360px]:inline">{tab.label}</span>
            <span className="min-[360px]:hidden">{tab.compactLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default App
