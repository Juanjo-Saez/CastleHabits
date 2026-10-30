import type { RelicId } from '../types'

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
}

export function hasRelic(relics: RelicId[] | undefined, id: RelicId): boolean {
  return Boolean(relics?.includes(id))
}

export function relicMaxHpBonus(relics: RelicId[] | undefined, legionVictories?: number): number {
  if (!hasRelic(relics, 'heart')) return 0
  const victories = legionVictories ?? 1
  return Math.max(0, victories) * (RELICS.heart.maxHpPerVictory ?? 0)
}
