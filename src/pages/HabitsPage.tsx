import PageHeader from '../components/PageHeader'

function HabitsPage() {
  return (
    <div>
      <PageHeader title="Hábitos" subtitle="Tus rutinas de hoy" />
      <div className="flex flex-col items-center gap-2 px-4 py-16 text-center text-slate-500 dark:text-slate-400">
        <span className="text-3xl">✓</span>
        <p>Todavía no tienes hábitos. Fase 1: aquí podrás crearlos.</p>
      </div>
    </div>
  )
}

export default HabitsPage
