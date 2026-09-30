import { NavLink, Route, Routes } from 'react-router-dom'
import ChoresPage from './pages/ChoresPage'
import HabitsPage from './pages/HabitsPage'
import ProfilePage from './pages/ProfilePage'
import StatsPage from './pages/StatsPage'

const tabs = [
  { to: '/', label: 'Hábitos', icon: '✓', end: true },
  { to: '/tareas', label: 'Tareas', icon: '🏠' },
  { to: '/stats', label: 'Stats', icon: '📊' },
  { to: '/perfil', label: 'Perfil', icon: '🧑' },
]

function App() {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="flex-1 overflow-y-auto pb-20">
        <Routes>
          <Route path="/" element={<HabitsPage />} />
          <Route path="/tareas" element={<ChoresPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                isActive
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-slate-500 dark:text-slate-400'
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
