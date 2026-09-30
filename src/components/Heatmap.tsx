import type { DayStat } from '../lib/stats'

function colorFor(ratio: number | null): string {
  if (ratio === null) return 'bg-crypt-800'
  if (ratio === 0) return 'bg-blood-700/50'
  if (ratio < 0.5) return 'bg-gold-600/30'
  if (ratio < 1) return 'bg-gold-500/60'
  return 'bg-gold-400'
}

function Heatmap({ data }: Readonly<{ data: DayStat[] }>) {
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2">
      {data.map((day) => {
        const label =
          day.ratio === null ? 'sin tareas debidas' : `${Math.round(day.ratio * 100)}%`
        return (
          <div
            key={day.key}
            title={`${day.key}: ${label}`}
            className={`h-3 w-3 rounded-[2px] ${colorFor(day.ratio)}`}
          />
        )
      })}
    </div>
  )
}

export default Heatmap
