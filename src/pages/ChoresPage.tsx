import PageHeader from '../components/PageHeader'

function ChoresPage() {
  return (
    <div>
      <PageHeader title="Tareas del hogar" subtitle="Organizadas por zona" />
      <div className="flex flex-col items-center gap-2 px-4 py-16 text-center text-slate-500 dark:text-slate-400">
        <span className="text-3xl">🏠</span>
        <p>
          Todavía no tienes tareas ni todos. Fase 2: recurrencia y zonas de la
          casa.
        </p>
      </div>
    </div>
  )
}

export default ChoresPage
