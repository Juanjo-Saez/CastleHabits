import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import type {
  BossEncounter,
  BossId,
  BossResource,
  Completion,
  Item,
  PlayerProfile,
} from '../types'
import { activityDateKey } from './date'
import { HP_PER_LEVEL, xpToNextLevel } from './gamification'
import { isItemDueOn, isObligation, isWindowCompleted } from './recurrence'
import { effectiveMaxHp } from './routes'

export interface BossDefinition {
  id: BossId
  name: string
  /** Días operativos que permanece activo, contando el primero. */
  windowDays: number
  /** Días completos necesarios para vencerlo. */
  targetDays: number
  defeatDamage: number
  /** Porcentaje de la EXP que se conserva mientras está activo. */
  xpPercent: number
  reward: { xp: number; coins: number }
  resources: readonly BossResource[]
  /** Rango inclusivo, en días, de la espera antes de aparecer y entre apariciones. */
  minDelay: number
  maxDelay: number
}

export const BOSSES: Record<BossId, BossDefinition> = {
  'giant-bat': {
    id: 'giant-bat',
    name: 'Murciélago gigante',
    windowDays: 5,
    targetDays: 2,
    defeatDamage: 20,
    xpPercent: 70,
    reward: { xp: 100, coins: 50 },
    resources: ['postponeToken', 'vitalityPotion', 'streakFreeze'],
    minDelay: 10,
    maxDelay: 15,
  },
}

export const RESOURCE_LABEL: Record<BossResource, string> = {
  postponeToken: 'Sello de aplazamiento',
  vitalityPotion: 'Poción de vigor',
  streakFreeze: 'Congelación de racha',
}

type Random = () => number

export function shiftKey(dateKey: string, days: number): string {
  return format(addDays(parseISO(dateKey), days), 'yyyy-MM-dd')
}

/** Entero aleatorio en [min, max], ambos incluidos. */
export function randomInt(min: number, max: number, random: Random = Math.random): number {
  return min + Math.min(max - min, Math.floor(random() * (max - min + 1)))
}

export function rollDelay(boss: BossDefinition, random: Random = Math.random): number {
  return randomInt(boss.minDelay, boss.maxDelay, random)
}

export function isPending(encounter: BossEncounter): boolean {
  return encounter.status === 'scheduled' || encounter.status === 'cooldown'
}

export function isResolved(encounter: BossEncounter): boolean {
  return encounter.status === 'victory' || encounter.status === 'defeat'
}

/** La aparición más reciente: la única que puede estar pendiente o activa. */
export function latestEncounter(encounters: BossEncounter[]): BossEncounter | undefined {
  return encounters.reduce<BossEncounter | undefined>(
    (latest, candidate) => (!latest || candidate.sequence > latest.sequence ? candidate : latest),
    undefined,
  )
}

export function activeEncounter(encounters: BossEncounter[]): BossEncounter | null {
  const latest = latestEncounter(encounters)
  return latest?.status === 'active' ? latest : null
}

/** La última aparición ya resuelta, para anunciar su resultado. */
export function lastResolved(encounters: BossEncounter[]): BossEncounter | null {
  return encounters
    .filter(isResolved)
    .reduce<BossEncounter | null>(
      (latest, candidate) => (!latest || candidate.sequence > latest.sequence ? candidate : latest),
      null,
    )
}

export function isEffectActiveOn(encounter: BossEncounter | null | undefined, dateKey: string): boolean {
  return encounter?.status === 'active'
    && Boolean(encounter.windowStart && encounter.windowEnd)
    && dateKey >= (encounter.windowStart as string)
    && dateKey <= (encounter.windowEnd as string)
}

/** EXP tras el efecto del boss: se aplica después de los bonos normales y redondea hacia arriba. */
export function bossXp(xp: number, encounter: BossEncounter | null | undefined, dateKey: string): number {
  if (!isEffectActiveOn(encounter, dateKey)) return xp
  const { xpPercent } = BOSSES[(encounter as BossEncounter).bossId]
  return Math.ceil((xp * xpPercent) / 100)
}

/**
 * Obligación que cuenta para el boss: recurrentes del Castillo y pergaminos con vencimiento ese día.
 * Quedan fuera los hábitos y las misiones secundarias (también las de ruta).
 */
export function isBossObligation(item: Item): boolean {
  return !item.archived && item.type !== 'habit' && isObligation(item)
}

export function isBossDueOn(item: Item, dateKey: string): boolean {
  if (!isBossObligation(item) || activityDateKey(item.createdAt) > dateKey) return false
  if (item.type === 'todo') return (item.postponedUntil ?? item.dueDate) === dateKey
  return isItemDueOn(item, parseISO(dateKey))
}

export interface BossDayStatus {
  due: number
  done: number
  /** Al menos una obligación debida y todas cumplidas: los días vacíos no cuentan. */
  complete: boolean
}

export function evaluateBossDay(
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  dateKey: string,
): BossDayStatus {
  let due = 0
  let done = 0
  for (const item of items) {
    if (!isBossDueOn(item, dateKey)) continue
    due += 1
    if (isWindowCompleted(item, completionsByItem[item.id] ?? [], dateKey)) done += 1
  }
  return { due, done, complete: due > 0 && done === due }
}

/** Fechas completas dentro de la ventana, hasta hoy: no tienen que ser consecutivas. */
export function completeDatesOf(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  today: string,
): string[] {
  if (!encounter.windowStart || !encounter.windowEnd) return []
  const last = encounter.windowEnd < today ? encounter.windowEnd : today
  const dates: string[] = []
  for (let day = encounter.windowStart; day <= last; day = shiftKey(day, 1)) {
    if (evaluateBossDay(items, completionsByItem, day).complete) dates.push(day)
  }
  return dates
}

export interface BossSummary {
  encounter: BossEncounter
  definition: BossDefinition
  completedDates: string[]
  target: number
  /** Días que quedan de la ventana, contando hoy; 0 si no está activo. */
  daysLeft: number
  today: BossDayStatus
}

export function summarizeBoss(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  today: string,
): BossSummary {
  const definition = BOSSES[encounter.bossId]
  const active = encounter.status === 'active'
  return {
    encounter,
    definition,
    completedDates: active ? completeDatesOf(encounter, items, completionsByItem, today) : [],
    target: definition.targetDays,
    daysLeft: active && encounter.windowEnd
      ? Math.max(0, differenceInCalendarDays(parseISO(encounter.windowEnd), parseISO(today)) + 1)
      : 0,
    today: evaluateBossDay(items, completionsByItem, today),
  }
}

/** ¿Esta tarea cuenta hoy para el boss activo? Sirve para destacarla en la interfaz. */
export function bossCountsFor(item: Item, encounter: BossEncounter | null, dateKey: string): boolean {
  return isEffectActiveOn(encounter, dateKey) && isBossDueOn(item, dateKey)
}

function newEncounter(
  bossId: BossId,
  sequence: number,
  status: 'scheduled' | 'cooldown',
  scheduledFor: string,
): BossEncounter {
  return {
    id: `${bossId}:${sequence}`,
    bossId,
    sequence,
    status,
    scheduledFor,
    rewardGranted: false,
    damageApplied: false,
    createdAt: new Date().toISOString(),
  }
}

export function applyBossDamage(profile: PlayerProfile, damage: number): PlayerProfile {
  const hp = Math.max(0, profile.hp - damage)
  return { ...profile, hp, dead: hp === 0 }
}

/** Misma progresión que una completación normal: sube niveles y restaura la vida al subir. */
export function applyBossReward(
  profile: PlayerProfile,
  boss: BossDefinition,
  resource: BossResource,
): { profile: PlayerProfile; leveledUp: boolean } {
  let { level, maxHp } = profile
  let xp = profile.xp + boss.reward.xp
  let leveledUp = false
  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level)
    level += 1
    maxHp += HP_PER_LEVEL
    leveledUp = true
  }
  const next: PlayerProfile = {
    ...profile,
    level,
    xp,
    maxHp,
    coins: profile.coins + boss.reward.coins,
    postponeTokens: profile.postponeTokens + (resource === 'postponeToken' ? 1 : 0),
    vitalityPotions: profile.vitalityPotions + (resource === 'vitalityPotion' ? 1 : 0),
    streakFreezes: profile.streakFreezes + (resource === 'streakFreeze' ? 1 : 0),
  }
  return {
    profile: leveledUp ? { ...next, hp: effectiveMaxHp(next) } : next,
    leveledUp,
  }
}

export interface BossSyncInput {
  today: string
  profile: PlayerProfile
  items: Item[]
  completionsByItem: Record<string, Completion[]>
  encounters: BossEncounter[]
  random?: Random
}

export interface BossSyncResult {
  encounters: BossEncounter[]
  /** Registros que hay que persistir; vacío si nada cambia. */
  changed: BossEncounter[]
  /** Mismo objeto que el de entrada si el perfil no cambia. */
  profile: PlayerProfile
  leveledUp: boolean
}

/**
 * Avanza el ciclo del boss hasta hoy. Es idempotente: con los registros ya resueltos
 * (recompensa y daño marcados) una nueva evaluación no cambia nada.
 */
export function planBossSync(input: BossSyncInput): BossSyncResult {
  const { today, items, completionsByItem } = input
  const random = input.random ?? Math.random
  const definition = BOSSES['giant-bat']
  const changed = new Map<string, BossEncounter>()
  const records = new Map(input.encounters.map((encounter) => [encounter.id, encounter]))
  let profile = input.profile
  let leveledUp = false

  const save = (encounter: BossEncounter) => {
    records.set(encounter.id, encounter)
    changed.set(encounter.id, encounter)
  }
  const unchanged = (): BossSyncResult => ({
    encounters: input.encounters, changed: [], profile: input.profile, leveledUp: false,
  })
  if (profile.dead) return unchanged()

  let current = latestEncounter([...records.values()])
  if (!current) {
    current = newEncounter(definition.id, 1, 'scheduled', shiftKey(today, rollDelay(definition, random)))
    save(current)
  }

  // Una resolución crea la siguiente aparición; el tope evita bucles tras una ausencia muy larga.
  for (let step = 0; step < 4 && current; step += 1) {
    const boss = BOSSES[current.bossId]
    if (isPending(current)) {
      if (today < current.scheduledFor) break
      current = {
        ...current,
        status: 'active',
        windowStart: today,
        windowEnd: shiftKey(today, boss.windowDays - 1),
      }
      save(current)
    }
    if (current.status !== 'active') break

    const dates = completeDatesOf(current, items, completionsByItem, today)
    let resolved: BossEncounter | null = null
    if (dates.length >= boss.targetDays) {
      const resource = boss.resources[randomInt(0, boss.resources.length - 1, random)]
      const reward = applyBossReward(profile, boss, resource)
      profile = reward.profile
      leveledUp = leveledUp || reward.leveledUp
      resolved = {
        ...current, status: 'victory', resolvedOn: dates[boss.targetDays - 1],
        rewardGranted: true, rewardResource: resource,
      }
    } else if (today > (current.windowEnd as string)) {
      profile = applyBossDamage(profile, boss.defeatDamage)
      resolved = {
        ...current, status: 'defeat', resolvedOn: shiftKey(current.windowEnd as string, 1), damageApplied: true,
      }
    }
    if (!resolved) break

    const nextActivationOn = shiftKey(resolved.resolvedOn as string, rollDelay(boss, random))
    save({ ...resolved, nextActivationOn })
    current = newEncounter(boss.id, resolved.sequence + 1, 'cooldown', nextActivationOn)
    save(current)
    if (profile.dead) break
  }

  const changedList = [...changed.values()]
  return {
    encounters: [...records.values()].sort((left, right) => left.sequence - right.sequence),
    changed: changedList,
    profile,
    leveledUp,
  }
}
