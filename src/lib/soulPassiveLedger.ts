import { db } from '../db/database'
import { shiftDateKey } from './date'
import type {
  DaySnapshot,
  PlayerProfile,
  SoulId,
  SoulPassiveActivation,
  SoulPassiveId,
} from '../types'

export interface SoulPassiveActivationInput {
  profile: Pick<PlayerProfile, 'souls' | 'equippedSouls' | 'dailySoulLoadout'>
  soulId: SoulId
  date: string
  runStartedAt: string
  sourceId: string
  snapshot?: Pick<DaySnapshot, 'date' | 'soulLoadout' | 'soulRanks'>
  rankOverride?: SoulPassiveActivation['rank']
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

export function soulPassiveRankOn(
  profile: SoulPassiveActivationInput['profile'],
  soulId: SoulId,
  date: string,
  snapshot?: Pick<DaySnapshot, 'date' | 'soulLoadout' | 'soulRanks'>,
): SoulPassiveActivation['rank'] | 0 {
  const loadout = snapshot?.date === date
    ? snapshot.soulLoadout
    : profile.dailySoulLoadout?.date === date
      ? profile.dailySoulLoadout.souls
      : undefined
  const ownedRank = profile.souls?.[soulId]?.rank
  if (!loadout?.includes(soulId) || !ownedRank) return 0
  return snapshot?.date === date
    ? snapshot.soulRanks?.[soulId] ?? ownedRank
    : ownedRank
}

/** Builds an activation only when the soul was owned and equipped on that activity date. */
export function createSoulPassiveActivation(
  input: SoulPassiveActivationInput,
): SoulPassiveActivation | null {
  if (!input.runStartedAt || !input.sourceId) return null

  const rank = soulPassiveRankOn(input.profile, input.soulId, input.date, input.snapshot)
  if (!rank) return null
  const actualRank = input.rankOverride ?? rank

  const passiveId = ({
    'giant-bat': 'dailyXp',
    'slogra-gaibon': 'dailyCoins',
    legion: 'trivialCoins',
    frankenstein: 'zoneXp',
    succubus: 'dailyPotion',
    death: 'secondChance',
    medusa: 'weeklyFreeze',
    cerberus: 'damageReduction',
    'hydra-scylla': 'hydraDawnHeal',
    doppelganger: 'weeklyReflection',
  } as const)[input.soulId]
  if (!passiveId) return null

  return {
    id: activationId(input.runStartedAt, passiveId, input.sourceId),
    soulId: input.soulId,
    passiveId,
    rank: actualRank,
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
