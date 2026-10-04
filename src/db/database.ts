import Dexie, { type Table } from 'dexie'
import type {
  Achievement,
  Completion,
  Item,
  PlayerProfile,
  Reward,
} from '../types'

const PLAYER_PROFILE_ID = 1

export class AppDatabase extends Dexie {
  items!: Table<Item, string>
  completions!: Table<Completion, string>
  profile!: Table<PlayerProfile, number>
  achievements!: Table<Achievement, string>
  rewards!: Table<Reward, string>

  constructor() {
    super('habitos-db')
    this.version(1).stores({
      items: 'id, type',
      completions: 'id, itemId, date, [itemId+date]',
      profile: 'id',
      achievements: 'id',
      rewards: 'id',
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
    hp: 50,
    maxHp: 50,
    streakFreezes: 0,
    hardcore: true,
    dead: false,
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
