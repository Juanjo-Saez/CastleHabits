import { db } from '../db/database'
import type {
  Achievement,
  Completion,
  Item,
  ItemEvent,
  PlayerProfile,
  Reminder,
  Reward,
} from '../types'

interface BackupData {
  version: 1 | 2 | 3
  exportedAt: string
  items: Item[]
  completions: Completion[]
  itemEvents?: ItemEvent[]
  profile: PlayerProfile[]
  achievements: Achievement[]
  rewards: Reward[]
  reminders?: Reminder[]
}

export async function exportBackup(): Promise<void> {
  const [items, completions, itemEvents, profile, achievements, rewards, reminders] =
    await Promise.all([
      db.items.toArray(),
      db.completions.toArray(),
      db.itemEvents.toArray(),
      db.profile.toArray(),
      db.achievements.toArray(),
      db.rewards.toArray(),
      db.reminders.toArray(),
    ])

  const data: BackupData = {
    version: 3,
    exportedAt: new Date().toISOString(),
    items,
    completions,
    itemEvents,
    profile,
    achievements,
    rewards,
    reminders,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `habitos-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

/** Restaura un backup, sobrescribiendo todos los datos actuales. */
export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text) as BackupData
  if (data.version !== 1 && data.version !== 2 && data.version !== 3) {
    throw new Error('Versión de backup no soportada')
  }

  // Los backups v1 y v2 no incluyen eventos ni recordatorios: se importan vacíos.
  const itemEvents = data.itemEvents ?? []
  const reminders = data.reminders ?? []

  await db.transaction(
    'rw',
    [
      db.items,
      db.completions,
      db.itemEvents,
      db.profile,
      db.achievements,
      db.rewards,
      db.reminders,
      db.daySnapshots,
    ],
    async () => {
      // Los snapshots del resumen no viajan en el backup: se descartan los del estado anterior.
      await Promise.all([
        db.items.clear(),
        db.completions.clear(),
        db.itemEvents.clear(),
        db.profile.clear(),
        db.achievements.clear(),
        db.rewards.clear(),
        db.reminders.clear(),
        db.daySnapshots.clear(),
      ])
      await Promise.all([
        db.items.bulkAdd(data.items),
        db.completions.bulkAdd(data.completions),
        db.itemEvents.bulkAdd(itemEvents),
        db.profile.bulkAdd(data.profile),
        db.achievements.bulkAdd(data.achievements),
        db.rewards.bulkAdd(data.rewards),
        db.reminders.bulkAdd(reminders),
      ])
    },
  )
}
