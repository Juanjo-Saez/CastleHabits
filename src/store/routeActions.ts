import { ROUTES } from '../lib/routes'
import type { RouteId } from '../types'
import { useItemsStore } from './useItemsStore'
import { usePlayerStore } from './usePlayerStore'

/** Inicia la ruta y crea sus actividades iniciales como misiones secundarias vinculadas. */
export async function startRoute(routeId: RouteId): Promise<boolean> {
  const started = await usePlayerStore.getState().startRoute(routeId)
  if (!started) return false

  for (const activity of ROUTES[routeId].activities) {
    await useItemsStore.getState().addItem({
      type: 'habit',
      commitment: 'sideQuest',
      routeId,
      ...activity,
    })
  }
  return true
}
