import { useEffect } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import ChoresPage from './pages/ChoresPage'
import HabitsPage from './pages/HabitsPage'
import ProfilePage from './pages/ProfilePage'
import StatsPage from './pages/StatsPage'
import { useItemsStore } from './store/useItemsStore'
import { usePlayerStore } from './store/usePlayerStore'

const tabs = [
  { to: '/', label: 'Hábitos', icon: '🕯️', end: true },
  { to: '/tareas', label: 'Castillo', icon: '🏰' },
  { to: '/stats', label: 'Crónicas', icon: '📜' },
  { to: '/perfil', label: 'Cazador', icon: '🧛' },
]

function App() {
  const loadItems = useItemsStore((s) => s.load)
  const loadPlayer = usePlayerStore((s) => s.load)

  useEffect(() => {
    loadItems()
    loadPlayer()
  }, [loadItems, loadPlayer])

  return (
    <div className="mx-auto flex h-full max-w-md flex-col border-x border-gold-600/30 bg-transparent">
      <main className="flex-1 overflow-y-auto pb-20">
        <Routes>
          <Route path="/" element={<HabitsPage />} />
          <Route path="/tareas" element={<ChoresPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md border-t border-gold-600/40 bg-crypt-950/95 backdrop-blur">
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
