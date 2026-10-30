import type { DailySoulLoadout, PlayerProfile, SoulAward, SoulId, SoulProgress, SoulRank } from '../types'

export const MAX_SOUL_PITY = 20

export type SoulPassiveId =
  | 'dailyXp'
  | 'dailyCoins'
  | 'weeklyPostpone'
  | 'trivialCoins'
  | 'zoneXp'
  | 'dailyPotion'
  | 'secondChance'
  | 'weeklyFreeze'

export interface SoulDefinition {
  id: SoulId
  name: string
  passiveId?: SoulPassiveId
  effectDescription: string
}

const SOUL_NAMES: Partial<Record<SoulId, string>> = {
  'giant-bat': 'Alma del Murciélago gigante',
  'slogra-gaibon': 'Almas de Slogra y Gaibon',
  legion: 'Alma de Legion',
  frankenstein: 'Alma de Frankenstein',
  succubus: 'Alma de Succubus',
  death: 'Alma de Death',
  medusa: 'Alma de Medusa',
}

const SOUL_PASSIVES: Partial<Record<SoulId, SoulPassiveId>> = {
  'giant-bat': 'dailyXp',
  'slogra-gaibon': 'dailyCoins',
  legion: 'trivialCoins',
  frankenstein: 'zoneXp',
  succubus: 'dailyPotion',
  death: 'secondChance',
  medusa: 'weeklyFreeze',
}

const SOUL_EFFECTS: Partial<Record<SoulId, string>> = {
  'giant-bat': '+5 % de EXP en un día con todas las obligaciones cumplidas.',
  'slogra-gaibon': '+5 monedas al cumplir 5 tareas en un día.',
  legion: 'Las tareas triviales dan +1 moneda.',
  frankenstein: 'La primera tarea de cada zona da +20 % de EXP al día.',
  succubus: 'La primera poción del día cura el doble.',
  death: 'Segunda oportunidad: una vez por expedición sobrevives a un golpe mortal con 1 HP.',
  medusa: 'Una congelación de racha gratis cada 7 días.',
}

export const SOULS: Partial<Record<SoulId, SoulDefinition>> = Object.fromEntries(
  (Object.keys(SOUL_NAMES) as SoulId[]).map((id) => [
    id,
    {
      id,
      name: SOUL_NAMES[id] ?? `Alma de ${id}`,
      passiveId: SOUL_PASSIVES[id],
      effectDescription: SOUL_EFFECTS[id] ?? 'Su efecto se definirá en el cambio específico de este boss.',
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

export interface EquippedSoulPassive {
  id: SoulId
  passiveId: SoulPassiveId
  rank: SoulRank
}

/** Devuelve el rango runtime de un Alma: solo existe mientras está equipada y obtenida. */
type SoulProfile = Pick<PlayerProfile, 'souls' | 'equippedSouls'> & {
  dailySoulLoadout?: DailySoulLoadout
}

export function equippedSoulRank(
  profile: SoulProfile,
  id: SoulId,
  dateKey?: string,
): SoulRank | 0 {
  if (dateKey && profile.dailySoulLoadout?.date !== dateKey) return 0
  if (!profile.equippedSouls?.includes(id)) return 0
  return profile.souls?.[id]?.rank ?? 0
}

/** Lista pasivas activas, deduplicada y sin entradas obsoletas del perfil. */
export function equippedSoulPassives(
  profile: SoulProfile,
): EquippedSoulPassive[] {
  const seen = new Set<SoulId>()
  return (profile.equippedSouls ?? []).flatMap((id) => {
    if (seen.has(id)) return []
    seen.add(id)
    const definition = soulDefinition(id)
    const rank = equippedSoulRank(profile, id)
    if (!definition.passiveId || rank === 0) return []
    return [{ id, passiveId: definition.passiveId, rank }]
  })
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
