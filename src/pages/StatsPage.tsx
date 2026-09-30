import { useMemo } from 'react'
import Heatmap from '../components/Heatmap'
import PageHeader from '../components/PageHeader'
import TrendChart from '../components/TrendChart'
import { buildDailyStats } from '../lib/stats'
import { computeStreak } from '../lib/streak'
import { useItemsStore } from '../store/useItemsStore'

function StatsPage() {
  const items = useItemsStore((s) => s.items)
  const completionsByItem = useItemsStore((s) => s.completionsByItem)

  const heatmapData = useMemo(
    () => buildDailyStats(items, completionsByItem, 84),
    [items, completionsByItem],
  )
  const trendData = useMemo(
    () => buildDailyStats(items, completionsByItem, 14),
    [items, completionsByItem],
  )

  const totalCompletions = useMemo(
    () => Object.values(completionsByItem).reduce((sum, list) => sum + list.length, 0),
    [completionsByItem],
  )

  const bestStreak = useMemo(() => {
    let max = 0
    for (const item of items) {
      if (item.type === 'todo' || item.archived) continue
      const streak = computeStreak(item, completionsByItem[item.id] ?? [])
      if (streak > max) max = streak
    }
    return max
  }, [items, completionsByItem])

  return (
    <div>
      <PageHeader title="Crónicas" subtitle="El registro de tu travesía" />

      <div className="flex flex-col gap-6 px-5 py-4">
        <div className="flex gap-3">
          <div className="flex-1 rounded-sm border border-gold-600/30 bg-crypt-900/60 p-3 text-center">
            <p className="font-display text-xl text-gold-400">{totalCompletions}</p>
            <p className="text-xs italic text-parchment-500">tareas completadas</p>
          </div>
          <div className="flex-1 rounded-sm border border-gold-600/30 bg-crypt-900/60 p-3 text-center">
            <p className="font-display text-xl text-gold-400">🔥 {bestStreak}</p>
            <p className="text-xs italic text-parchment-500">mejor racha</p>
          </div>
        </div>

        <div>
          <h2 className="mb-2 font-heading text-xs tracking-widest text-parchment-500 uppercase">
            Los últimos 12 lunares
          </h2>
          <Heatmap data={heatmapData} />
        </div>

        <div>
          <h2 className="mb-2 font-heading text-xs tracking-widest text-parchment-500 uppercase">
            Últimos 14 días
          </h2>
          <TrendChart data={trendData} />
        </div>
      </div>
    </div>
  )
}

export default StatsPage
