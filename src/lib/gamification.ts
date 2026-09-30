import type { Difficulty } from '../types'

export const DIFFICULTY_XP: Record<Difficulty, number> = {
  trivial: 5,
  easy: 10,
  medium: 15,
  hard: 20,
}

export const DIFFICULTY_COINS: Record<Difficulty, number> = {
  trivial: 1,
  easy: 2,
  medium: 3,
  hard: 5,
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  trivial: 'Trivial',
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
}

/** XP necesaria para pasar del nivel dado al siguiente. */
export function xpToNextLevel(level: number): number {
  return 50 + level * 25
}
