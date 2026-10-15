import { todayKey } from './date'
import { completionInWindow, isItemDueOn, isObligation, isWindowCompleted } from './recurrence'
import type { Completion, Item, Reminder } from '../types'

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

  await showNotice(title, body, 'daily-reminder')
}

async function showNotice(title: string, body: string, tag: string): Promise<void> {
  const registration = await navigator.serviceWorker?.getRegistration()
  if (registration) {
    await registration.showNotification(title, { body, icon: '/app-icon.svg', tag })
  } else {
    new Notification(title, { body, icon: '/app-icon.svg', tag })
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

const NOTIFIED_REMINDERS_KEY = 'habitos:notifiedReminders'

function notifiedRemindersToday(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFIED_REMINDERS_KEY) ?? 'null') as {
      date: string
      ids: string[]
    } | null
    return stored?.date === todayKey() ? stored.ids : []
  } catch {
    return []
  }
}

/** Avisa una vez al día de cada recordatorio vencido; no genera tareas ni recompensas. */
export async function notifyDueReminders(dueReminders: Reminder[]): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return

  const notified = notifiedRemindersToday()
  const fresh = dueReminders.filter((reminder) => !notified.includes(reminder.id))
  if (fresh.length === 0) return

  const body =
    fresh.length === 1 ? fresh[0].title : `Tienes ${fresh.length} recordatorios pendientes.`
  await showNotice('Recordatorio del Castillo', body, 'reminder-due')

  localStorage.setItem(
    NOTIFIED_REMINDERS_KEY,
    JSON.stringify({ date: todayKey(), ids: [...notified, ...fresh.map((r) => r.id)] }),
  )
}
