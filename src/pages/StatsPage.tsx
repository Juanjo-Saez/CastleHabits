import PageHeader from '../components/PageHeader'

function StatsPage() {
  return (
    <div>
      <PageHeader title="Crónicas" subtitle="El registro de tu travesía" />
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-parchment-500">
        <span className="text-3xl">📜</span>
        <p className="font-body italic">
          Fase 6: calendario tipo heatmap y gráficas de tendencia.
        </p>
      </div>
    </div>
  )
}

export default StatsPage
