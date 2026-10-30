import Dexie, { type Table } from 'dexie'
import { defaultRoutes } from '../lib/routes'
import { todayKey } from '../lib/date'
import { migrateLegacyZone } from '../lib/zones'
import type {
  Achievement,
  BossEncounter,
  Completion,
  DaySnapshot,
  Item,
  ItemEvent,
  PlayerProfile,
  Reminder,
  Reward,
} from '../types'

const PLAYER_PROFILE_ID = 1

export class AppDatabase extends Dexie {
  items!: Table<Item, string>
  completions!: Table<Completion, string>
  itemEvents!: Table<ItemEvent, string>
  profile!: Table<PlayerProfile, number>
  achievements!: Table<Achievement, string>
  rewards!: Table<Reward, string>
  reminders!: Table<Reminder, string>
  daySnapshots!: Table<DaySnapshot, string>
  bossEncounters!: Table<BossEncounter, string>

  constructor() {
    super('habitos-db')
    this.version(1).stores({
      items: 'id, type',
      completions: 'id, itemId, date, [itemId+date]',
      profile: 'id',
      achievements: 'id',
      rewards: 'id',
    })
    this.version(2).stores({
      items: 'id, type',
      completions: 'id, itemId, date, [itemId+date]',
      itemEvents: 'id, itemId, kind, scheduledDate, [itemId+scheduledDate+kind]',
      profile: 'id',
      achievements: 'id',
      rewards: 'id',
    })
    this.version(3)
      .stores({
        items: 'id, type',
        completions: 'id, itemId, date, [itemId+date]',
        itemEvents: 'id, itemId, kind, scheduledDate, [itemId+scheduledDate+kind]',
        profile: 'id',
        achievements: 'id',
        rewards: 'id',
      })
      .upgrade(async (transaction) => {
        const items = (await transaction.table('items').toArray()) as Item[]
        for (const item of items) {
          const zone = migrateLegacyZone(item.zone)
          if (zone !== item.zone) {
            await transaction.table('items').update(item.id, { zone })
          }
        }
      })
    this.version(4).stores({
      items: 'id, type',
      completions: 'id, itemId, date, [itemId+date]',
      itemEvents: 'id, itemId, kind, scheduledDate, [itemId+scheduledDate+kind]',
      profile: 'id',
      achievements: 'id',
      rewards: 'id',
      reminders: 'id',
    })
    this.version(5).stores({
      items: 'id, type',
      completions: 'id, itemId, date, [itemId+date]',
      itemEvents: 'id, itemId, kind, scheduledDate, [itemId+scheduledDate+kind]',
      profile: 'id',
      achievements: 'id',
      rewards: 'id',
      reminders: 'id',
      daySnapshots: 'date',
    })
    this.version(6).stores({
      items: 'id, type',
      completions: 'id, itemId, date, [itemId+date]',
      itemEvents: 'id, itemId, kind, scheduledDate, [itemId+scheduledDate+kind]',
      profile: 'id',
      achievements: 'id',
      rewards: 'id',
      reminders: 'id',
      daySnapshots: 'date',
      bossEncounters: 'id, bossId, status, scheduledFor',
    })
    this.version(7)
      .stores({
        items: 'id, type',
        completions: 'id, itemId, date, [itemId+date]',
        itemEvents: 'id, itemId, kind, scheduledDate, [itemId+scheduledDate+kind]',
        profile: 'id',
        achievements: 'id',
        rewards: 'id',
        reminders: 'id',
        daySnapshots: 'date',
        bossEncounters: 'id, bossId, status, scheduledFor',
      })
      .upgrade(async (transaction) => {
        await transaction.table('profile').toCollection().modify((profile: Record<string, unknown>) => {
          profile.souls ??= {}
          profile.soulPity ??= {}
          profile.relics ??= []
          profile.equippedSouls ??= []
          profile.penanceProgress ??= {}
        })
      })
  }
}

export const db = new AppDatabase()

export async function ensurePlayerProfile(): Promise<PlayerProfile> {
  const existing = await db.profile.get(PLAYER_PROFILE_ID)
  if (existing) return existing

  const fresh: PlayerProfile = {
    id: PLAYER_PROFILE_ID,
    level: 1,
    xp: 0,
    coins: 0,
    postponeTokens: 0,
    vitalityPotions: 0,
    hp: 20,
    maxHp: 20,
    streakFreezes: 0,
    holyWater: 0,
    curses: [],
    penanceProgress: {},
    routes: defaultRoutes(),
    equippedRoute: null,
    souls: {},
    soulPity: {},
    relics: [],
    equippedSouls: [],
    hardcore: true,
    dead: false,
    runStartedAt: new Date().toISOString(),
  }

  try {
    await db.profile.add(fresh)
    return fresh
  } catch {
    // Llamada concurrente (ej. React StrictMode) ya lo creó primero; usamos ese registro.
    const createdByRace = await db.profile.get(PLAYER_PROFILE_ID)
    if (createdByRace) return createdByRace
    throw new Error('No se pudo crear el perfil del jugador')
  }
}

export async function resetAllAppData(): Promise<void> {
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
      db.bossEncounters,
    ],
    async () => {
      await Promise.all([
        db.items.clear(),
        db.completions.clear(),
        db.itemEvents.clear(),
        db.profile.clear(),
        db.achievements.clear(),
        db.rewards.clear(),
        db.reminders.clear(),
        db.daySnapshots.clear(),
        db.bossEncounters.clear(),
      ])
      const profile = await ensurePlayerProfile()
      await db.profile.put({ ...profile, lastPenaltyCheck: todayKey() })
    },
  )
}
