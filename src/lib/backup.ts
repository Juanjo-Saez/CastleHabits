import { db } from '../db/database'
import type { Achievement, Completion, Item, PlayerProfile, Reward } from '../types'

interface BackupData {
  version: 1
  exportedAt: string
  items: Item[]
  completions: Completion[]
  profile: PlayerProfile[]
  achievements: Achievement[]
  rewards: Reward[]
}

export async function exportBackup(): Promise<void> {
  const [items, completions, profile, achievements, rewards] = await Promise.all([
    db.items.toArray(),
    db.completions.toArray(),
    db.profile.toArray(),
    db.achievements.toArray(),
    db.rewards.toArray(),
  ])

  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    items,
    completions,
    profile,
    achievements,
    rewards,
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
  if (data.version !== 1) throw new Error('Versión de backup no soportada')

  await db.transaction(
    'rw',
    [db.items, db.completions, db.profile, db.achievements, db.rewards],
    async () => {
      await Promise.all([
        db.items.clear(),
        db.completions.clear(),
        db.profile.clear(),
        db.achievements.clear(),
        db.rewards.clear(),
      ])
      await Promise.all([
        db.items.bulkAdd(data.items),
        db.completions.bulkAdd(data.completions),
        db.profile.bulkAdd(data.profile),
        db.achievements.bulkAdd(data.achievements),
        db.rewards.bulkAdd(data.rewards),
      ])
    },
  )
}
