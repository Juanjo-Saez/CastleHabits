import { ROUTES } from '../lib/routes'
import type { RouteId } from '../types'
import { useItemsStore } from './useItemsStore'
import { usePlayerStore } from './usePlayerStore'

/** Inicia la ruta y crea sus actividades iniciales como misiones secundarias vinculadas. */
export async function startRoute(routeId: RouteId): Promise<boolean> {
  const started = await usePlayerStore.getState().startRoute(routeId)
  if (!started) return false

  for (const activity of ROUTES[routeId].activities) {
    const alreadyCreated = useItemsStore.getState().items.some(
      (item) =>
        item.type === 'habit' &&
        item.commitment === 'sideQuest' &&
        item.routeId === routeId &&
        item.title === activity.title &&
        !item.archived,
    )
    if (alreadyCreated) continue

    await useItemsStore.getState().addItem({
      type: 'habit',
      commitment: 'sideQuest',
      routeId,
      ...activity,
    })
  }
  return true
}

export async function restartExpedition(): Promise<void> {
  await usePlayerStore.getState().restartRun()
  await useItemsStore.getState().load()
}
