import { db } from '../db/database'
import { shiftDateKey } from './date'
import type {
  DaySnapshot,
  PlayerProfile,
  SoulId,
  SoulPassiveActivation,
  SoulPassiveId,
} from '../types'
import { equippedSoulRank } from './souls'

export interface SoulPassiveActivationInput {
  profile: Pick<PlayerProfile, 'souls' | 'equippedSouls' | 'dailySoulLoadout'>
  soulId: SoulId
  date: string
  runStartedAt: string
  sourceId: string
  snapshot?: DaySnapshot
}

export function soulPassiveCooldownDays(rank: 1 | 2 | 3): number {
  return [7, 5, 3][rank - 1]
}

export function soulPassiveReadyOn(activation: SoulPassiveActivation): string {
  return shiftDateKey(activation.date, soulPassiveCooldownDays(activation.rank))
}

export function soulPassiveCooldownReady(
  activations: SoulPassiveActivation[],
  date: string,
): boolean {
  return activations.every((activation) => soulPassiveReadyOn(activation) <= date)
}

function activationId(runStartedAt: string, passiveId: SoulPassiveId, sourceId: string): string {
  return [runStartedAt, passiveId, sourceId].map(encodeURIComponent).join(':')
}

/** Builds an activation only when the soul was owned and equipped on that activity date. */
export function createSoulPassiveActivation(
  input: SoulPassiveActivationInput,
): SoulPassiveActivation | null {
  if (!input.runStartedAt || !input.sourceId) return null

  const loadout = input.snapshot?.date === input.date
    ? input.snapshot.soulLoadout
    : input.profile.dailySoulLoadout?.date === input.date
      ? input.profile.dailySoulLoadout.souls
      : undefined
  if (!loadout?.includes(input.soulId)) return null

  const profileForDate = {
    ...input.profile,
    equippedSouls: loadout,
    dailySoulLoadout: { date: input.date, souls: loadout },
  }
  const rank = equippedSoulRank(profileForDate, input.soulId, input.date)
  if (!rank) return null

  const passiveId = ({
    'giant-bat': 'dailyXp',
    'slogra-gaibon': 'dailyCoins',
    legion: 'trivialCoins',
    frankenstein: 'zoneXp',
    succubus: 'dailyPotion',
    death: 'secondChance',
    medusa: 'weeklyFreeze',
  } as const)[input.soulId]
  if (!passiveId) return null

  return {
    id: activationId(input.runStartedAt, passiveId, input.sourceId),
    soulId: input.soulId,
    passiveId,
    rank,
    date: input.date,
    runStartedAt: input.runStartedAt,
    sourceId: input.sourceId,
  }
}

/** Writes an activation once; retries with the same source key return the original occurrence. */
export async function recordSoulPassiveActivation(
  input: SoulPassiveActivationInput,
): Promise<SoulPassiveActivation | null> {
  const activation = createSoulPassiveActivation(input)
  if (!activation) return null

  return db.transaction('rw', db.soulPassiveActivations, async () => {
    const existing = await db.soulPassiveActivations.get(activation.id)
    if (existing) return existing
    await db.soulPassiveActivations.add(activation)
    return activation
  })
}

export interface SoulPassiveActivationReconciliation {
  upsert: SoulPassiveActivation[]
  deleteIds: string[]
}

export function planSoulPassiveActivationReconciliation(
  existing: SoulPassiveActivation[],
  runStartedAt: string,
  sourceIds: string[],
  expected: SoulPassiveActivation[],
): SoulPassiveActivationReconciliation {
  const sourceScope = new Set(sourceIds)
  if (expected.some((activation) =>
    activation.runStartedAt !== runStartedAt || !sourceScope.has(activation.sourceId),
  )) {
    throw new Error('Las activaciones esperadas deben pertenecer a la expedición y fuentes reconciliadas.')
  }

  const expectedById = new Map(expected.map((activation) => [activation.id, activation]))
  const deleteIds = existing
    .filter((activation) =>
      activation.runStartedAt === runStartedAt
      && sourceScope.has(activation.sourceId)
      && !expectedById.has(activation.id),
    )
    .map((activation) => activation.id)

  return { upsert: [...expectedById.values()], deleteIds }
}

/**
 * Reconciles activations emitted by a set of source records after correction/replay.
 * Records from other expeditions and sources are left untouched.
 */
export async function reconcileSoulPassiveActivations(
  runStartedAt: string,
  sourceIds: string[],
  expected: SoulPassiveActivation[],
): Promise<void> {
  await db.transaction('rw', db.soulPassiveActivations, async () => {
    const existing = await db.soulPassiveActivations
      .where('runStartedAt')
      .equals(runStartedAt)
      .toArray()
    const plan = planSoulPassiveActivationReconciliation(existing, runStartedAt, sourceIds, expected)
    await db.soulPassiveActivations.bulkDelete(plan.deleteIds)
    await db.soulPassiveActivations.bulkPut(plan.upsert)
  })
}
