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

/** Daño de vitalidad al dejar pasar una tarea vencida, según dificultad. */
export const DIFFICULTY_DAMAGE: Record<Difficulty, number> = {
  trivial: 1,
  easy: 2,
  medium: 4,
  hard: 6,
}

/** XP necesaria para pasar del nivel dado al siguiente. */
export function xpToNextLevel(level: number): number {
  return 50 + level * 25
}

export interface AvatarStage {
  minLevel: number
  icon: string
  title: string
}

export const AVATAR_STAGES: AvatarStage[] = [
  { minLevel: 1, icon: '🧛', title: 'Novicio de la Noche' },
  { minLevel: 5, icon: '🧟', title: 'Cazador Veterano' },
  { minLevel: 10, icon: '💀', title: 'Señor de la Noche' },
  { minLevel: 20, icon: '🐉', title: 'Azote de Drácula' },
]

export function getAvatarStage(level: number): AvatarStage {
  return (
    [...AVATAR_STAGES].reverse().find((stage) => level >= stage.minLevel) ??
    AVATAR_STAGES[0]
  )
}
