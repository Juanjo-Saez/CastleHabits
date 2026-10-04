import { todayKey } from './date'
import { isItemDueOn, isObligation } from './recurrence'
import type { Completion, Item } from '../types'

const LAST_REMINDER_KEY = 'habitos:lastReminderDate'

export function isNotificationSupported(): boolean {
  return 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied'
  return Notification.requestPermission()
}

export async function showReminder(pendingCount: number): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return

  const title = 'El Castillo te reclama'
  const body =
    pendingCount === 1
      ? 'Tienes 1 tarea pendiente hoy.'
      : `Tienes ${pendingCount} tareas pendientes hoy.`

  const registration = await navigator.serviceWorker?.getRegistration()
  if (registration) {
    await registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
      tag: 'daily-reminder',
    })
  } else {
    new Notification(title, { body, icon: '/favicon.svg' })
  }
}

export function hasRemindedToday(): boolean {
  return localStorage.getItem(LAST_REMINDER_KEY) === new Date().toDateString()
}

export function markRemindedToday(): void {
  localStorage.setItem(LAST_REMINDER_KEY, new Date().toDateString())
}

/** Cuenta obligaciones debidas hoy; las misiones secundarias no generan deuda. */
export function countPendingToday(
  items: Item[],
  completionsToday: Record<string, Completion>,
): number {
  const today = new Date()
  const key = todayKey()
  let pending = 0

  for (const item of items) {
    if (item.archived || !isObligation(item)) continue

    if (item.type === 'todo') {
      if (item.dueDate && item.dueDate <= key && !completionsToday[item.id]) {
        pending += 1
      }
      continue
    }

    if (!isItemDueOn(item, today)) continue
    const completion = completionsToday[item.id]
    const done =
      item.trackingType === 'quantity'
        ? (completion?.quantityDone ?? 0) >= (item.quantityGoal ?? 0)
        : Boolean(completion)
    if (!done) pending += 1
  }

  return pending
}
