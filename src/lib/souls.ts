import type { PlayerProfile, SoulAward, SoulId, SoulProgress, SoulRank } from '../types'

export const MAX_SOUL_PITY = 20

export interface SoulDefinition {
  id: SoulId
  name: string
  effectDescription: string
}

const SOUL_NAMES: Partial<Record<SoulId, string>> = {
  'giant-bat': 'Alma del Murciélago gigante',
  'slogra-gaibon': 'Almas de Slogra y Gaibon',
  legion: 'Alma de Legion',
  frankenstein: 'Alma de Frankenstein',
  succubus: 'Alma de Succubus',
  death: 'Alma de Death',
}

export const SOULS: Partial<Record<SoulId, SoulDefinition>> = Object.fromEntries(
  (Object.keys(SOUL_NAMES) as SoulId[]).map((id) => [
    id,
    {
      id,
      name: SOUL_NAMES[id] ?? `Alma de ${id}`,
      effectDescription: 'Su efecto se define en el cambio específico de este boss.',
    },
  ]),
) as Partial<Record<SoulId, SoulDefinition>>

export function soulDefinition(id: SoulId): SoulDefinition {
  return SOULS[id] ?? {
    id,
    name: `Alma de ${id}`,
    effectDescription: 'Su efecto se definirá en el cambio específico de este boss.',
  }
}

export function soulSlotsForLevel(level: number): number {
  if (level >= 20) return 3
  if (level >= 10) return 2
  if (level >= 5) return 1
  return 0
}

export function soulChanceWithPity(baseChance: number, pity: number): number {
  return Math.min(1, baseChance + Math.max(0, Math.min(MAX_SOUL_PITY, pity)) / 100)
}

export interface SoulCollectionResult {
  profile: PlayerProfile
  award?: SoulAward
  chance: number
}

function nextSoulProgress(id: SoulId, current: SoulProgress | undefined): { progress: SoulProgress; award: SoulAward } {
  if (!current) {
    return {
      progress: { rank: 1, fragments: 0 },
      award: { id, rank: 1, repeated: false, upgraded: false },
    }
  }
  if (current.rank === 3) {
    return {
      progress: current,
      award: { id, rank: 3, repeated: true, upgraded: false },
    }
  }
  const fragments = current.fragments + 1
  if (fragments < 3) {
    return {
      progress: { ...current, fragments },
      award: { id, rank: current.rank, repeated: true, upgraded: false },
    }
  }
  const rank = (current.rank + 1) as SoulRank
  return {
    progress: { rank, fragments: 0 },
    award: { id, rank, repeated: true, upgraded: true },
  }
}

/** Resuelve una victoria de alma y actualiza piedad/progreso sin mutar el perfil original. */
export function collectSoul(
  profile: PlayerProfile,
  id: SoulId,
  baseChance: number,
  random: () => number,
): SoulCollectionResult {
  const pity = profile.soulPity?.[id] ?? 0
  const chance = soulChanceWithPity(baseChance, pity)
  if (random() >= chance) {
    return {
      profile: {
        ...profile,
        soulPity: { ...(profile.soulPity ?? {}), [id]: Math.min(MAX_SOUL_PITY, pity + 1) },
      },
      chance,
    }
  }

  const next = nextSoulProgress(id, profile.souls?.[id])
  const award = next.award
  return {
    profile: {
      ...profile,
      souls: { ...(profile.souls ?? {}), [id]: next.progress },
      soulPity: { ...(profile.soulPity ?? {}), [id]: 0 },
    },
    award,
    chance,
  }
}
