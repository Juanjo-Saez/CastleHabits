import { format, parseISO } from 'date-fns'
import { recentMisses, RECENT_MISS_DAYS } from '../lib/streak'
import { useItemsStore } from '../store/useItemsStore'
import SectionTitle from './SectionTitle'

function RecentMissesPanel() {
  const items = useItemsStore((s) => s.items)
  const completionsByItem = useItemsStore((s) => s.completionsByItem)
  const misses = recentMisses(items, completionsByItem)

  if (misses.length === 0) return null

  return (
    <div className="cv-panel cv-panel--blood p-3">
      <SectionTitle>Fallos recientes</SectionTitle>
      <p className="mt-1 font-body text-sm text-silver-500 italic">
        Obligaciones cerradas sin cumplir en los últimos {RECENT_MISS_DAYS} días.
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {misses.map(({ item, dateKey }) => (
          <li key={`${item.id}-${dateKey}`} className="flex items-baseline justify-between gap-2">
            <span className="font-pixel text-xl text-silver-100">{item.title}</span>
            <span className="font-body text-sm text-blood-400 italic">{format(parseISO(dateKey), 'dd/MM')}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RecentMissesPanel
