import type { ActiveCurse, BossId, CurseId, PlayerProfile } from '../types'
import { shiftDateKey } from './date'
import { hasRelic } from './relics'

export interface CurseDefinition {
  id: CurseId
  name: string
  description: string
  severity: 'leve' | 'grave'
  /** Porcentaje de la EXP que se conserva. */
  xpPercent?: number
  coinPercent?: number
  /** Porcentaje de lo que curan las pociones; 0 = no curan. */
  potionPercent?: number
  blocksPostpone?: boolean
  /** Vida que quita cada día, sin bajar nunca de 1. */
  drainPerDay?: number
  /** Cambio temporal de vida máxima mientras dure la maldición. */
  maxHpDelta?: number
  /** Cambio porcentual de vida máxima mientras dure la maldición. */
  maxHpPercent?: number
}

/** Maldiciones leves: caducan solas. Las graves llegarán con los bosses que las aplican. */
export const CURSES: Record<CurseId, CurseDefinition> = {
  impaledSpear: {
    id: 'impaledSpear', name: 'Lanza clavada', severity: 'leve', drainPerDay: 1,
    description: 'Pierdes 1 de vida al día, sin llegar a morir.',
  },
  heaviness: {
    id: 'heaviness', name: 'Pesadez', severity: 'leve', xpPercent: 80,
    description: 'Ganas un 20 % menos de EXP.',
  },
  avarice: {
    id: 'avarice', name: 'Avaricia', severity: 'leve', coinPercent: 50,
    description: 'Ganas la mitad de monedas.',
  },
  silence: {
    id: 'silence', name: 'Silencio', severity: 'leve', blocksPostpone: true,
    description: 'No puedes aplazar obligaciones.',
  },
  poison: {
    id: 'poison', name: 'Veneno', severity: 'leve', drainPerDay: 1,
    description: 'Pierdes 1 de vida al día, sin llegar a morir.',
  },
  charm: {
    id: 'charm', name: 'Encanto', severity: 'leve', potionPercent: 0,
    description: 'Las pociones de vigor no curan.',
  },
  shadow: {
    id: 'shadow', name: 'Sombra', severity: 'leve', xpPercent: 90,
    description: 'Ganas un 10 % menos de EXP.',
  },
  stitches: {
    id: 'stitches', name: 'Costuras', severity: 'leve', maxHpDelta: -5,
    description: 'Tu vida máxima se reduce en 5 puntos.',
  },
  deathScythe: {
    id: 'deathScythe', name: 'Hoz de Death', severity: 'grave', maxHpPercent: -10,
    description: 'Tu vida máxima se reduce un 10 % hasta pagar el responso.',
  },
}

export const MAX_CURSES = 2

/** Una maldición rige desde el día en que se aplica hasta el anterior a `expiresOn`. */
export function isCurseActiveOn(curse: ActiveCurse, dateKey: string): boolean {
  return dateKey >= curse.startedOn && (curse.permanent || dateKey < curse.expiresOn)
}

export function activeCursesOn(curses: ActiveCurse[] | undefined, dateKey: string): ActiveCurse[] {
  return (curses ?? []).filter((curse) => isCurseActiveOn(curse, dateKey))
}

/**
 * Aplica una maldición. Si ya existe se renueva su duración; con el máximo alcanzado
 * sustituye a la que antes caduca.
 */
export function addCurse(
  curses: ActiveCurse[] | undefined,
  id: CurseId,
  sourceBoss: BossId,
  today: string,
  days: number,
  permanent = false,
  relics?: PlayerProfile['relics'],
): ActiveCurse[] {
  const adjustedDays = !permanent && CURSES[id].severity === 'leve' && hasRelic(relics, 'rosary')
    ? Math.max(1, Math.ceil(days / 2))
    : days
  const expiresOn = permanent ? '9999-12-31' : shiftDateKey(today, adjustedDays)
  const current = curses ?? []
  const existing = current.find((curse) => curse.id === id)
  if (existing) {
    return current.map((curse) => (curse.id === id
      ? { ...curse, expiresOn: curse.expiresOn > expiresOn ? curse.expiresOn : expiresOn }
      : curse))
  }
  const fresh: ActiveCurse = { id, sourceBoss, startedOn: today, expiresOn, ...(permanent ? { permanent: true } : {}) }
  if (current.length < MAX_CURSES) return [...current, fresh]
  const soonest = [...current].sort((left, right) => left.expiresOn.localeCompare(right.expiresOn))[0]
  return [...current.filter((curse) => curse !== soonest), fresh]
}

export function removeCurse(curses: ActiveCurse[] | undefined, id: CurseId): ActiveCurse[] {
  return (curses ?? []).filter((curse) => curse.id !== id)
}

export interface CurseTick {
  curses: ActiveCurse[]
  hp: number
  changed: boolean
}

/**
 * Aplica el daño diario atrasado hasta hoy y retira las caducadas. Es idempotente: cada día
 * se cobra una sola vez gracias a `lastTickOn`. La vida nunca baja de 1.
 */
export function tickCurses(curses: ActiveCurse[] | undefined, hp: number, today: string): CurseTick {
  const current = curses ?? []
  let health = hp
  let changed = false
  const next: ActiveCurse[] = []
  for (const curse of current) {
    let lastTickOn = curse.lastTickOn
    const drain = CURSES[curse.id]?.drainPerDay ?? 0
    if (drain > 0) {
      let day = lastTickOn ? shiftDateKey(lastTickOn, 1) : curse.startedOn
      while (day <= today && day < curse.expiresOn) {
        health = Math.max(Math.min(health, 1), health - drain)
        lastTickOn = day
        day = shiftDateKey(day, 1)
      }
    }
    if (!curse.permanent && today >= curse.expiresOn) {
      changed = true
      continue
    }
    if (lastTickOn !== curse.lastTickOn) changed = true
    next.push(lastTickOn === curse.lastTickOn ? curse : { ...curse, lastTickOn })
  }
  return { curses: changed ? next : current, hp: health, changed: changed || health !== hp }
}

/** Precio en monedas de que la sacerdotisa cure una maldición. */
export function cureCost(level: number): number {
  return 30 + 10 * level
}

export function hasCurse(profile: Pick<PlayerProfile, 'curses'> | null | undefined, id: CurseId): boolean {
  return Boolean(profile?.curses?.some((curse) => curse.id === id))
}
