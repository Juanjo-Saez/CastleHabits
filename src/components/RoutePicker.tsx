import { ROUTE_IDS, ROUTES } from '../lib/routes'
import { usePlayerStore } from '../store/usePlayerStore'
import type { RouteId } from '../types'

function RoutePicker({
  value,
  onChange,
}: Readonly<{ value: RouteId | undefined; onChange: (routeId: RouteId | undefined) => void }>) {
  const routes = usePlayerStore((s) => s.profile?.routes)
  const started = ROUTE_IDS.filter((id) => routes?.[id].windowStart)
  if (started.length === 0) return null

  return (
    <label className="flex flex-col gap-1">
      <span className="cv-label">Ruta</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange((e.target.value || undefined) as RouteId | undefined)}
        className="cv-input"
      >
        <option value="">Sin ruta</option>
        {started.map((id) => (
          <option key={id} value={id}>{ROUTES[id].name}</option>
        ))}
      </select>
    </label>
  )
}

export default RoutePicker
