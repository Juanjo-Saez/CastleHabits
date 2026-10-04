import type { ItemEvent } from '../types'

export interface ItemStats {
  itemId: string
  itemTitle: string
  completed: number
  missed: number
  lateRecoveries: number
  partialProgress: number
  undone: number
  postponed: number
  totalDamage: number
  totalXp: number
  totalCoins: number
  firstActivityAt?: string
  lastActivityAt?: string
}

/** Reduce eventos privados a datos consultables por bosses y futuras reliquias. */
export function buildItemStats(events: ItemEvent[]): Record<string, ItemStats> {
  const stats: Record<string, ItemStats> = {}

  for (const event of events) {
    const current = stats[event.itemId] ?? {
      itemId: event.itemId,
      itemTitle: event.itemTitle,
      completed: 0,
      missed: 0,
      lateRecoveries: 0,
      partialProgress: 0,
      undone: 0,
      postponed: 0,
      totalDamage: 0,
      totalXp: 0,
      totalCoins: 0,
      firstActivityAt: event.occurredAt,
      lastActivityAt: event.occurredAt,
    }

    current.itemTitle = event.itemTitle
    current.firstActivityAt = [current.firstActivityAt, event.occurredAt]
      .filter(Boolean)
      .sort()[0]
    current.lastActivityAt = [current.lastActivityAt, event.occurredAt]
      .filter(Boolean)
      .sort()
      .at(-1)
    current.totalDamage += event.damage ?? 0
    current.totalXp += event.xpEarned ?? 0
    current.totalCoins += event.coinsEarned ?? 0

    if (event.kind === 'completed') current.completed += 1
    if (event.kind === 'missed') current.missed += 1
    if (event.kind === 'lateRecovery') current.lateRecoveries += 1
    if (event.kind === 'partialProgress') current.partialProgress += 1
    if (event.kind === 'undone') current.undone += 1
    if (event.kind === 'postponed') current.postponed += 1

    stats[event.itemId] = current
  }

  return stats
}