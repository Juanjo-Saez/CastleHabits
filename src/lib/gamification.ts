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

export const DIFFICULTY_SKULLS: Record<Difficulty, number> = {
  trivial: 1,
  easy: 2,
  medium: 3,
  hard: 4,
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
  title: string
  /** Paleta para el sprite HUNTER de pixelArt.ts. */
  palette: Record<string, string>
  aura?: string
}

const SKIN = { O: '#05060f', S: '#e8c4a0', s: '#c49a78' }

export const AVATAR_STAGES: AvatarStage[] = [
  {
    minLevel: 1,
    title: 'Novicio de la Noche',
    palette: {
      ...SKIN,
      H: '#5a3b24',
      h: '#3b2616',
      E: '#2a1a10',
      C: '#4a3a2a',
      c: '#2e2418',
      T: '#8f7228',
      R: '#6b1a1a',
    },
  },
  {
    minLevel: 5,
    title: 'Cazador Veterano',
    palette: {
      ...SKIN,
      H: '#3a2a4a',
      h: '#241a30',
      E: '#1a1030',
      C: '#2a3480',
      c: '#161c4a',
      T: '#c9a24b',
      R: '#a8182f',
    },
  },
  {
    minLevel: 10,
    title: 'Señor de la Noche',
    palette: {
      ...SKIN,
      S: '#e6d9d0',
      s: '#b8a8a0',
      H: '#1d1925',
      h: '#0e0c14',
      E: '#d8283f',
      C: '#1a1a2a',
      c: '#0b0b16',
      T: '#e2c275',
      R: '#d8283f',
    },
    aura: 'rgba(216,40,63,0.55)',
  },
  {
    minLevel: 20,
    title: 'Azote de Drácula',
    palette: {
      ...SKIN,
      S: '#f0e0d4',
      s: '#c8b0a4',
      H: '#e8e4d0',
      h: '#a8a490',
      E: '#f3e3a8',
      C: '#5c0e1d',
      c: '#300610',
      T: '#f3e3a8',
      R: '#e2c275',
    },
    aura: 'rgba(243,227,168,0.6)',
  },
]

export function getAvatarStage(level: number): AvatarStage {
  return (
    [...AVATAR_STAGES].reverse().find((stage) => level >= stage.minLevel) ??
    AVATAR_STAGES[0]
  )
}
