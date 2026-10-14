import { todayKey } from './date'
import { completionInWindow, isItemDueOn, isObligation, isWindowCompleted } from './recurrence'
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
      icon: '/app-icon.svg',
      tag: 'daily-reminder',
    })
  } else {
    new Notification(title, { body, icon: '/app-icon.svg' })
  }
}

export function hasRemindedToday(): boolean {
  return localStorage.getItem(LAST_REMINDER_KEY) === new Date().toDateString()
}

export function markRemindedToday(): void {
  localStorage.setItem(LAST_REMINDER_KEY, new Date().toDateString())
}

export function clearReminderDate(): void {
  localStorage.removeItem(LAST_REMINDER_KEY)
}

/** Cuenta obligaciones debidas hoy; las misiones secundarias no generan deuda. */
export function countPendingToday(
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
): number {
  const today = new Date()
  const key = todayKey()
  let pending = 0

  for (const item of items) {
    if (item.archived || !isObligation(item)) continue
    const history = completionsByItem[item.id] ?? []

    if (item.type === 'todo') {
      if (item.dueDate && item.dueDate <= key && !completionInWindow(item, history, key)) {
        pending += 1
      }
      continue
    }

    // Con margen, la obligación sigue pendiente durante toda su ventana hasta cumplirla.
    if (!isItemDueOn(item, today)) continue
    if (!isWindowCompleted(item, history, key)) pending += 1
  }

  return pending
}
