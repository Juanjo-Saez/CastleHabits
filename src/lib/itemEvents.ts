import { v4 as uuid } from 'uuid'
import { db } from '../db/database'
import type { Item, ItemEvent, ItemEventKind } from '../types'

export function itemEventId(itemId: string, scheduledDate: string, kind: ItemEventKind): string {
  return `${itemId}:${scheduledDate}:${kind}`
}

export function buildItemEvent(
  item: Item,
  kind: ItemEventKind,
  scheduledDate: string,
  details: Omit<Partial<ItemEvent>, 'id' | 'itemId' | 'itemTitle' | 'itemType' | 'commitment' | 'kind' | 'scheduledDate' | 'occurredAt'> = {},
  id = uuid(),
): ItemEvent {
  return {
    id,
    itemId: item.id,
    itemTitle: item.title,
    itemType: item.type,
    commitment: item.commitment,
    kind,
    scheduledDate,
    occurredAt: new Date().toISOString(),
    ...details,
  }
}

export async function recordItemEvent(
  item: Item,
  kind: ItemEventKind,
  scheduledDate: string,
  details: Omit<Partial<ItemEvent>, 'id' | 'itemId' | 'itemTitle' | 'itemType' | 'commitment' | 'kind' | 'scheduledDate' | 'occurredAt'> = {},
  id?: string,
): Promise<ItemEvent> {
  if (id) {
    const existing = await db.itemEvents.get(id)
    if (existing) return existing
  }
  const event = buildItemEvent(item, kind, scheduledDate, details, id)
  await db.itemEvents.put(event)
  return event
}