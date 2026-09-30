import PageHeader from '../components/PageHeader'

function HabitsPage() {
  return (
    <div>
      <PageHeader title="Rituales Diarios" subtitle="Los hábitos que alimentan tu fuerza" />
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-parchment-500">
        <span className="text-3xl">🕯️</span>
        <p className="font-body italic">
          Aún no hay rituales grabados en el grimorio. Fase 1: aquí podrás
          invocarlos.
        </p>
      </div>
    </div>
  )
}

export default HabitsPage
