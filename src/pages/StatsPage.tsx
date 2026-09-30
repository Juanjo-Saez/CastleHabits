import PageHeader from '../components/PageHeader'

function StatsPage() {
  return (
    <div>
      <PageHeader title="Estadísticas" subtitle="Tu progreso en el tiempo" />
      <div className="flex flex-col items-center gap-2 px-4 py-16 text-center text-slate-500 dark:text-slate-400">
        <span className="text-3xl">📊</span>
        <p>Fase 6: calendario tipo heatmap y gráficas de tendencia.</p>
      </div>
    </div>
  )
}

export default StatsPage
