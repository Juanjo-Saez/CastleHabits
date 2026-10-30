import type { RelicId } from '../types'
import type { PlayerProfile } from '../types'
import { isEclipseDay } from './weather'

export interface RelicDefinition {
  id: RelicId
  name: string
  description: string
  maxHpPerVictory?: number
}

export const RELICS: Record<RelicId, RelicDefinition> = {
  rosary: {
    id: 'rosary',
    name: 'Rosario',
    description: 'Reduce a la mitad la duración de las maldiciones leves.',
  },
  silverMirror: {
    id: 'silverMirror',
    name: 'Espejo de plata',
    description: 'Desbloquea las estadísticas históricas de la expedición.',
  },
  heart: {
    id: 'heart',
    name: 'Corazón de Legion',
    description: 'Aumenta en 1 punto la vida máxima por cada victoria contra Legion en esta expedición.',
    maxHpPerVictory: 1,
  },
  ancientAmulet: {
    id: 'ancientAmulet',
    name: 'Amuleto antiguo',
    description: 'Pertenecía a un hombre muy callado...',
  },
}

export function canPurchaseAncientAmulet(
  profile: Pick<PlayerProfile, 'dead' | 'coins' | 'relics'> | null | undefined,
  dateKey: string,
  price: number,
  seed?: string,
): boolean {
  return Boolean(
    profile
    && !profile.dead
    && profile.coins >= price
    && !profile.relics?.includes('ancientAmulet')
    && isEclipseDay(dateKey, seed),
  )
}

export function hasRelic(relics: RelicId[] | undefined, id: RelicId): boolean {
  return Boolean(relics?.includes(id))
}

export function relicMaxHpBonus(relics: RelicId[] | undefined, legionVictories?: number): number {
  if (!hasRelic(relics, 'heart')) return 0
  const victories = legionVictories ?? 1
  return Math.max(0, victories) * (RELICS.heart.maxHpPerVictory ?? 0)
}
