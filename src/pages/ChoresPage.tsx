import PageHeader from '../components/PageHeader'

function ChoresPage() {
  return (
    <div>
      <PageHeader title="El Castillo" subtitle="Mantén a raya la decadencia, estancia por estancia" />
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-parchment-500">
        <span className="text-3xl">🏰</span>
        <p className="font-body italic">
          El castillo aún no tiene estancias registradas. Fase 2: recurrencia
          y zonas de la casa.
        </p>
      </div>
    </div>
  )
}

export default ChoresPage
