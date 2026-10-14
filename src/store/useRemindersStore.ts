import { v4 as uuid } from 'uuid'
import { create } from 'zustand'
import { db } from '../db/database'
import { todayKey } from '../lib/date'
import { tomorrowKey } from '../lib/reminders'
import type { Reminder, ReminderUnit } from '../types'

interface RemindersState {
  reminders: Reminder[]
  loading: boolean
  load: () => Promise<void>
  addReminder: (title: string, every: number, unit: ReminderUnit) => Promise<void>
  markDone: (reminderId: string) => Promise<void>
  snooze: (reminderId: string) => Promise<void>
  archive: (reminderId: string) => Promise<void>
}

export const useRemindersStore = create<RemindersState>((set, get) => {
  const patch = async (reminderId: string, changes: Partial<Reminder>) => {
    await db.reminders.update(reminderId, changes)
    set({
      reminders: get().reminders.map((r) => (r.id === reminderId ? { ...r, ...changes } : r)),
    })
  }

  return {
    reminders: [],
    loading: true,

    load: async () => {
      const all = await db.reminders.toArray()
      set({ reminders: all.filter((r) => !r.archived), loading: false })
    },

    addReminder: async (title, every, unit) => {
      const reminder: Reminder = {
        id: uuid(),
        title,
        every,
        unit,
        archived: false,
        createdAt: new Date().toISOString(),
      }
      await db.reminders.add(reminder)
      set({ reminders: [...get().reminders, reminder] })
    },

    markDone: async (reminderId) => {
      await patch(reminderId, { lastDoneOn: todayKey(), snoozedUntil: undefined })
    },

    snooze: async (reminderId) => {
      await patch(reminderId, { snoozedUntil: tomorrowKey() })
    },

    archive: async (reminderId) => {
      await patch(reminderId, { archived: true })
      set({ reminders: get().reminders.filter((r) => r.id !== reminderId) })
    },
  }
})
