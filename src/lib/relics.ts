import type { RelicId } from '../types'

export interface RelicDefinition {
  id: RelicId
  name: string
  description: string
  maxHpBonus?: number
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
    description: 'Revela las estadísticas históricas de la expedición.',
  },
  heart: {
    id: 'heart',
    name: 'Corazón',
    description: 'Aumenta en 5 puntos la vida máxima.',
    maxHpBonus: 5,
  },
}

export function hasRelic(relics: RelicId[] | undefined, id: RelicId): boolean {
  return Boolean(relics?.includes(id))
}

export function relicMaxHpBonus(relics: RelicId[] | undefined): number {
  return hasRelic(relics, 'heart') ? (RELICS.heart.maxHpBonus ?? 0) : 0
}
