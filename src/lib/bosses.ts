import { differenceInCalendarDays, parseISO } from 'date-fns'
import type {
  BossEncounter,
  BossId,
  BossResource,
  BossRewards,
  Completion,
  CurseId,
  Difficulty,
  Item,
  PlayerProfile,
} from '../types'
import { addCurse, tickCurses } from './curses'
import { activityDateKey, shiftDateKey } from './date'
import { HP_PER_LEVEL, xpToNextLevel } from './gamification'
import { isItemDueOn, isMetCompletion, isObligation, isWindowCompleted } from './recurrence'
import { effectiveMaxHp } from './routes'

type Random = () => number

/** Cómo se vence un boss: días completos de constancia, o golpes (una tarea cumplida = un golpe). */
export type BossObjective =
  | { kind: 'days'; targetDays: number }
  | { kind: 'pieces'; maxPieces: number }
  | {
    kind: 'lifeSteal'
    recovery: Record<Difficulty, number>
  }
  | {
    kind: 'hits'
    /** Fracción de la vida total que tiene la primera barra. */
    share: number
    damage: Record<Difficulty, number>
    load: { days: number; factor: number; min: number; max: number }
    /** Golpes de ciertas dificultades necesarios antes de poder dañar el núcleo. */
    guard?: { hits: number; difficulties: Difficulty[] }
  }

/** Efectos de entorno: rigen mientras el boss está activo. */
export type EnvEffect =
  | { kind: 'xpPercent'; percent: number }
  | { kind: 'potionPercent'; percent: number }
  | { kind: 'damagePercent'; percent: number }
  | { kind: 'hideTomorrow' }
  | { kind: 'zonePercent'; xpPercent: number; damagePercent: number }

/** Una entrada de la tabla de premios; cada una se sortea por separado. */
export interface DropEntry {
  /** `goldBag` suma monedas (el rango es la cantidad de oro). */
  item: BossResource | 'goldBag'
  chance: number
  min: number
  max: number
}

export interface BossDefinition {
  id: BossId
  name: string
  /** Nombre de cada barra de vida o parte; uno solo si no tiene partes. */
  parts: string[]
  /** Cómo nombrarlo en las frases: sujeto, complemento directo y si el verbo va en plural. */
  grammar: { subject: string; object: string; plural: boolean }
  mechanic: string
  /** Texto del bestiario: descripción breve y lore completo (este último con 10 victorias). */
  description: string
  lore: string
  /** Probabilidad base del alma en cada victoria; se muestra en el bestiario con 20 victorias. */
  soulChance: number
  windowDays: number
  objective: BossObjective
  effects: EnvEffect[]
  defeatDamage: number
  defeatCurse?: { id: CurseId; days: number }
  reward: { xp: number; coins: number }
  drops: DropEntry[]
  /** Texto específico para explicar una derrota cuando no hay daño directo adicional. */
  defeatText?: string
  /** Rango inclusivo, en días, del enfriamiento antes de la siguiente aparición. */
  minDelay: number
  maxDelay: number
  /** Peso en el sorteo del siguiente boss. */
  weight: number
  /** Si devuelve true al acabar el enfriamiento, este boss aparece antes que el sorteo. */
  trigger?: (context: BossTriggerContext) => boolean
}

export interface BossTriggerContext {
  today: string
  profile: PlayerProfile
  items: Item[]
  completionsByItem: Record<string, Completion[]>
  encounters: BossEncounter[]
}

export const BOSSES: Record<BossId, BossDefinition> = {
  'giant-bat': {
    id: 'giant-bat',
    name: 'Murciélago gigante',
    parts: ['Murciélago gigante'],
    grammar: { subject: 'El Murciélago gigante', object: 'al Murciélago gigante', plural: false },
    mechanic: 'Constancia',
    description: 'Una criatura que se descuelga de las vigas cuando la rutina del castillo se resquebraja.',
    lore: 'Nadie sabe si el Murciélago gigante es un guardián o un castigo. Vuela más alto cada vez que dejas una obligación a medias y solo se aquieta cuando el castillo recupera su ritmo.',
    soulChance: 0.03,
    windowDays: 5,
    objective: { kind: 'days', targetDays: 2 },
    effects: [{ kind: 'xpPercent', percent: 70 }],
    defeatDamage: 20,
    reward: { xp: 100, coins: 50 },
    drops: [
      { item: 'postponeToken', chance: 0.45, min: 1, max: 1 },
      { item: 'vitalityPotion', chance: 0.45, min: 1, max: 1 },
      { item: 'streakFreeze', chance: 0.35, min: 1, max: 1 },
      { item: 'holyWater', chance: 0.05, min: 1, max: 1 },
    ],
    minDelay: 10,
    maxDelay: 15,
    weight: 1,
  },
  'slogra-gaibon': {
    id: 'slogra-gaibon',
    name: 'Slogra y Gaibon',
    parts: ['Slogra', 'Gaibon'],
    grammar: { subject: 'Slogra y Gaibon', object: 'a Slogra y Gaibon', plural: true },
    mechanic: 'Golpes',
    description: 'Dos hermanos de piedra que custodian la puerta del castillo y se turnan para cerrarte el paso.',
    lore: 'Slogra cayó primero ante un cazador, y Gaibon juró vengarlo desde la torre. Cada golpe les quiebra un trozo de piedra, pero siempre queda algo de ellos en pie.',
    soulChance: 0.025,
    windowDays: 5,
    objective: {
      kind: 'hits',
      share: 0.55,
      damage: { trivial: 1, easy: 2, medium: 3, hard: 5 },
      load: { days: 5, factor: 0.9, min: 10, max: 80 },
    },
    effects: [{ kind: 'potionPercent', percent: 50 }],
    defeatDamage: 15,
    defeatCurse: { id: 'impaledSpear', days: 3 },
    reward: { xp: 120, coins: 60 },
    drops: [
      { item: 'postponeToken', chance: 0.4, min: 1, max: 1 },
      { item: 'vitalityPotion', chance: 0.5, min: 1, max: 1 },
      { item: 'holyWater', chance: 0.08, min: 1, max: 1 },
    ],
    minDelay: 10,
    maxDelay: 15,
    weight: 1,
  },
  legion: {
    id: 'legion',
    name: 'Legion',
    parts: ['Cáscara', 'Núcleo'],
    grammar: { subject: 'Legion', object: 'a Legion', plural: false },
    mechanic: 'Escudo y ruptura',
    description: 'Una esfera de cuerpos que se amontonan para ocultar el corazón que la mantiene unida.',
    lore: 'Cada cuerpo de Legion cree ser el centro de la esfera. Cuando la cáscara se rompe, todos recuerdan al mismo tiempo que solo hay un núcleo que vencer.',
    soulChance: 0.04,
    windowDays: 3,
    objective: {
      kind: 'hits',
      share: 0.5,
      damage: { trivial: 1, easy: 2, medium: 3, hard: 5 },
      load: { days: 3, factor: 1.2, min: 8, max: 50 },
      guard: { hits: 3, difficulties: ['medium', 'hard'] },
    },
    effects: [{ kind: 'damagePercent', percent: 150 }],
    defeatDamage: 15,
    defeatCurse: { id: 'heaviness', days: 7 },
    reward: { xp: 110, coins: 90 },
    drops: [
      { item: 'postponeToken', chance: 0.5, min: 1, max: 1 },
      { item: 'vitalityPotion', chance: 0.3, min: 1, max: 1 },
      { item: 'goldBag', chance: 0.35, min: 50, max: 150 },
    ],
    minDelay: 10,
    maxDelay: 15,
    weight: 1,
  },
  frankenstein: {
    id: 'frankenstein',
    name: 'Frankenstein',
    parts: ['Piezas'],
    grammar: { subject: 'Frankenstein', object: 'a Frankenstein', plural: false },
    mechanic: 'Piezas y relámpagos',
    description: 'Un monstruo cosido que vuelve a levantarse mientras una sola zona del castillo carga la tormenta.',
    lore: 'El doctor reunió cinco piezas y las ató a las estancias donde más se incumple. Cada obligación cumplida apaga una costura, pero Igor vuelve a remendarla cuando el día termina en deuda.',
    soulChance: 0.05,
    windowDays: 5,
    objective: { kind: 'pieces', maxPieces: 5 },
    effects: [{ kind: 'zonePercent', xpPercent: 200, damagePercent: 200 }],
    defeatDamage: 20,
    defeatCurse: { id: 'stitches', days: 7 },
    reward: { xp: 130, coins: 70 },
    drops: [
      { item: 'postponeToken', chance: 0.45, min: 1, max: 1 },
      { item: 'vitalityPotion', chance: 0.4, min: 1, max: 1 },
      { item: 'streakFreeze', chance: 0.3, min: 1, max: 1 },
      { item: 'holyWater', chance: 0.1, min: 1, max: 1 },
    ],
    minDelay: 10,
    maxDelay: 15,
    weight: 1,
  },
  succubus: {
    id: 'succubus',
    name: 'Succubus',
    parts: ['Sangre robada'],
    grammar: { subject: 'Succubus', object: 'a Succubus', plural: false },
    mechanic: 'Robo de vida',
    description: 'Una seductora nocturna que convierte tu propia vitalidad en una barra que debes recuperar.',
    lore: 'Succubus no necesita perseguirte: basta con que cruces su umbral para que una parte de tu sangre abandone el cuerpo. Cada tarea cumplida hace volver una gota, pero la criatura conserva para siempre lo que no rescates antes del amanecer.',
    soulChance: 0.03,
    windowDays: 5,
    objective: { kind: 'lifeSteal', recovery: { trivial: 1, easy: 1, medium: 1, hard: 2 } },
    effects: [{ kind: 'hideTomorrow' }],
    defeatDamage: 0,
    defeatCurse: { id: 'charm', days: 5 },
    reward: { xp: 120, coins: 60 },
    drops: [
      { item: 'postponeToken', chance: 0.2, min: 1, max: 1 },
      { item: 'vitalityPotion', chance: 0.6, min: 1, max: 1 },
      { item: 'streakFreeze', chance: 0.3, min: 1, max: 1 },
      { item: 'holyWater', chance: 0.25, min: 1, max: 1 },
    ],
    defeatText: 'La sangre que no recuperes se pierde para siempre',
    minDelay: 10,
    maxDelay: 15,
    weight: 1,
  },
}

export const BOSS_IDS = Object.keys(BOSSES) as BossId[]

export const RESOURCE_LABEL: Record<BossResource, string> = {
  postponeToken: 'Sello de aplazamiento',
  vitalityPotion: 'Poción de vigor',
  streakFreeze: 'Congelación de racha',
  holyWater: 'Agua bendita',
}

export function shiftKey(dateKey: string, days: number): string {
  return shiftDateKey(dateKey, days)
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

/** Porcentaje de un efecto de entorno que rige ese día, o 100 si no hay. */
export function effectPercent(
  encounter: BossEncounter | null | undefined,
  kind: EnvEffect['kind'],
  dateKey: string,
): number {
  if (!encounter || encounter.status !== 'active') return 100
  return effectPercentOn(encounter, kind, dateKey)
}

/** Porcentaje de un efecto para una fecha histórica de la ventana del encuentro. */
export function effectPercentOn(
  encounter: BossEncounter | null | undefined,
  kind: EnvEffect['kind'],
  dateKey: string,
): number {
  if (!encounter || !encounter.windowStart || !encounter.windowEnd
    || dateKey < encounter.windowStart || dateKey > encounter.windowEnd) return 100
  return BOSSES[encounter.bossId].effects
    .filter((effect): effect is Extract<EnvEffect, { percent: number }> => effect.kind === kind && 'percent' in effect)
    .reduce((percent, effect) => (percent * effect.percent) / 100, 100)
}

/** Zona cargada por Relámpagos en una fecha; es estable para una aparición concreta. */
export function chargedZoneOn(encounter: BossEncounter | null | undefined, dateKey: string): string | null {
  const zones = encounter?.zones ?? []
  if (!encounter || zones.length === 0 || !encounter.windowStart || !encounter.windowEnd
    || dateKey < encounter.windowStart || dateKey > encounter.windowEnd) return null
  const seed = `${encounter.id}:${dateKey}`
  const hash = [...seed].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 7)
  return zones[hash % zones.length]
}

/** Efecto global y, si procede, el multiplicador de la zona cargada para una tarea. */
function effectPercentForItemOnInternal(
  encounter: BossEncounter | null | undefined,
  kind: 'xpPercent' | 'damagePercent',
  dateKey: string,
  zone?: string,
): number {
  const global = effectPercentOn(encounter, kind, dateKey)
  if (!zone || chargedZoneOn(encounter, dateKey) !== zone) return global
  const zoneEffect = BOSSES[encounter?.bossId ?? 'giant-bat'].effects.find((effect) => effect.kind === 'zonePercent')
  if (!zoneEffect) return global
  const zonePercent = kind === 'xpPercent' ? zoneEffect.xpPercent : zoneEffect.damagePercent
  return (global * zonePercent) / 100
}

/** Efecto de una tarea en tiempo real; los encuentros resueltos ya no modifican recompensas. */
export function effectPercentForItem(
  encounter: BossEncounter | null | undefined,
  kind: 'xpPercent' | 'damagePercent',
  dateKey: string,
  zone?: string,
): number {
  if (!encounter || encounter.status !== 'active') return 100
  return effectPercentForItemOn(encounter, kind, dateKey, zone)
}

/** Efecto de una tarea en una fecha histórica, aunque el encuentro ya esté resuelto. */
export function effectPercentForItemOn(
  encounter: BossEncounter | null | undefined,
  kind: 'xpPercent' | 'damagePercent',
  dateKey: string,
  zone?: string,
): number {
  return effectPercentForItemOnInternal(encounter, kind, dateKey, zone)
}

/** EXP tras el efecto del boss: se aplica después de los bonos normales y redondea hacia arriba. */
export function bossXp(xp: number, encounter: BossEncounter | null | undefined, dateKey: string, zone?: string): number {
  const percent = effectPercentForItem(encounter, 'xpPercent', dateKey, zone)
  return percent === 100 ? xp : Math.ceil((xp * percent) / 100)
}

/**
 * Obligación que cuenta para el boss de constancia: recurrentes del Castillo y pergaminos con
 * vencimiento ese día. Quedan fuera los hábitos y las misiones secundarias (también las de ruta).
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

/**
 * Carga diaria real: mediana de obligaciones debidas por día en los 14 días anteriores,
 * solo con tareas que ya existían una semana antes. Se usa para calibrar la meta de cada boss.
 */
export function dailyLoad(items: Item[], today: string): number {
  const settled = items.filter((item) => activityDateKey(item.createdAt) <= shiftKey(today, -7))
  const counts: number[] = []
  for (let offset = 14; offset >= 1; offset -= 1) {
    const day = shiftKey(today, -offset)
    counts.push(settled.filter((item) => isBossDueOn(item, day)).length)
  }
  counts.sort((left, right) => left - right)
  return (counts[6] + counts[7]) / 2
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Meta que se fija al activar el boss: días a lograr, o vida total de un boss de golpes. */
export function bossGoal(boss: BossDefinition, items: Item[], today: string): number {
  if (boss.objective.kind === 'days') return boss.objective.targetDays
  if (boss.objective.kind === 'pieces') return bossZones(boss, items).length
  if (boss.objective.kind === 'lifeSteal') return 0
  const { days, factor, min, max } = boss.objective.load
  return clamp(Math.round(dailyLoad(items, today) * days * factor), min, max)
}

export function initialLifeStolen(profile: PlayerProfile): number {
  return Math.min(10, Math.max(0, profile.hp - 1))
}

/** Zonas fijadas al activar Frankenstein; el orden estable evita resultados distintos entre dispositivos. */
export function bossZones(boss: BossDefinition, items: Item[]): string[] {
  if (boss.objective.kind !== 'pieces') return []
  return [...new Set(items
    .filter((item) => isBossObligation(item) && item.zone)
    .map((item) => item.zone as string))]
    .sort((left, right) => left.localeCompare(right))
    .slice(0, boss.objective.maxPieces)
}

export interface BossBar {
  name: string
  max: number
  hp: number
}

/** Reparte el daño total entre las barras: la primera se agota antes de herir la segunda. */
export function splitBars(boss: BossDefinition, goal: number, damage: number, guardHits = 0): BossBar[] {
  if (boss.objective.kind === 'hits' && boss.objective.guard) {
    const guard = boss.objective.guard
    return [
      { name: boss.parts[0], max: guard.hits, hp: Math.max(0, guard.hits - Math.min(guardHits, guard.hits)) },
      { name: boss.parts[1] ?? 'Núcleo', max: goal, hp: Math.max(0, goal - damage) },
    ]
  }

  if (boss.objective.kind !== 'hits' || boss.parts.length < 2) {
    return [{ name: boss.parts[0], max: goal, hp: Math.max(0, goal - damage) }]
  }
  const first = Math.round(goal * boss.objective.share)
  const dealtFirst = Math.min(damage, first)
  const dealtSecond = clamp(damage - first, 0, goal - first)
  return [
    { name: boss.parts[0], max: first, hp: first - dealtFirst },
    { name: boss.parts[1], max: goal - first, hp: goal - first - dealtSecond },
  ]
}

export function lifeBars(boss: BossDefinition, goal: number, recovered: number): BossBar[] {
  if (boss.objective.kind !== 'lifeSteal') return []
  return [{
    name: boss.parts[0],
    max: goal,
    hp: Math.max(0, goal - recovered),
  }]
}

export interface HitProgress {
  damage: number
  /** Primer día en que el daño acumulado alcanza la meta. */
  reachedOn?: string
  /** Golpes que han roto la cáscara, si el boss tiene una. */
  guardHits?: number
  guardBrokenOn?: string
}

export interface LifeProgress {
  recovered: number
  reachedOn?: string
}

export interface PieceProgress {
  disabledZones: string[]
  reachedOn?: string
}

function zoneStatus(
  zone: string,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  dateKey: string,
): { due: number; done: number } {
  const zoneItems = items.filter((item) => item.zone === zone && isBossDueOn(item, dateKey))
  const done = zoneItems.filter((item) => isWindowCompleted(item, completionsByItem[item.id] ?? [], dateKey)).length
  return { due: zoneItems.length, done }
}

/** Estado de las piezas y sus remiendos diarios, derivado de las obligaciones de cada zona. */
export function pieceProgress(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  today: string,
): PieceProgress {
  const zones = encounter.zones ?? []
  if (!encounter.windowStart || !encounter.windowEnd || zones.length === 0) return { disabledZones: [] }
  const last = encounter.windowEnd < today ? encounter.windowEnd : today
  const disabled = new Set<string>()
  let reachedOn: string | undefined
  for (let day = encounter.windowStart; day <= last; day = shiftKey(day, 1)) {
    const statuses = zones.map((zone) => ({ zone, ...zoneStatus(zone, items, completionsByItem, day) }))
    const hasUnfulfilled = statuses.some((status) => status.due > status.done)
    if (hasUnfulfilled) {
      const repaired = zones.find((zone) => disabled.has(zone))
      if (repaired) disabled.delete(repaired)
    }
    for (const status of statuses) {
      if (status.done > 0) disabled.add(status.zone)
    }
    if (!reachedOn && !hasUnfulfilled && disabled.size === zones.length) reachedOn = day
  }
  return { disabledZones: zones.filter((zone) => disabled.has(zone)), reachedOn }
}

/** Daño acumulado por cumplidos de la ventana; se deriva siempre de los registros reales. */
export function hitProgress(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  today: string,
): HitProgress {
  const boss = BOSSES[encounter.bossId]
  if (boss.objective.kind !== 'hits' || !encounter.windowStart || !encounter.windowEnd) return { damage: 0 }
  const { damage: table, guard } = boss.objective
  const last = encounter.windowEnd < today ? encounter.windowEnd : today
  const completions: { itemId: string; date: string; createdAt: string; id: string; damage: number; difficulty: Difficulty }[] = []
  // Todas las tareas golpean, también las creadas durante el combate; archivadas incluidas si ya cumplieron.
  for (const item of items) {
    for (const completion of completionsByItem[item.id] ?? []) {
      if (completion.date < encounter.windowStart || completion.date > last || !isMetCompletion(item, completion)) continue
      completions.push({
        itemId: item.id,
        date: completion.date,
        createdAt: completion.createdAt,
        id: completion.id,
        damage: table[item.difficulty],
        difficulty: item.difficulty,
      })
    }

  }
  completions.sort((left, right) => left.date.localeCompare(right.date)
    || left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
  const perDay = new Map<string, number>()
  const seen = new Set<string>()
  let guardHits = 0
  let guardBrokenOn: string | undefined
  for (const completion of completions) {
    const itemDay = `${completion.itemId}:${completion.date}`
    if (seen.has(itemDay)) continue
    seen.add(itemDay)
    if (guard && !guardBrokenOn) {
      if (guard.difficulties.includes(completion.difficulty)) {
        guardHits += 1
        if (guardHits >= guard.hits) guardBrokenOn = completion.date
      }
      continue
    }
    perDay.set(completion.date, (perDay.get(completion.date) ?? 0) + completion.damage)
  }
  const goal = encounter.goal ?? 0
  let total = 0
  let reachedOn: string | undefined
  for (let day = encounter.windowStart; day <= last; day = shiftKey(day, 1)) {
    total += perDay.get(day) ?? 0
    if (!reachedOn && goal > 0 && total >= goal) reachedOn = day
  }
  return { damage: total, reachedOn, guardHits: guard ? guardHits : undefined, guardBrokenOn }
}

/** Sangre recuperada por completados durante la ventana del encuentro. */
export function lifeProgress(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  today: string,
): LifeProgress {
  const boss = BOSSES[encounter.bossId]
  if (boss.objective.kind !== 'lifeSteal' || !encounter.windowStart || !encounter.windowEnd) {
    return { recovered: 0 }
  }
  const last = encounter.windowEnd < today ? encounter.windowEnd : today
  const recoveryByDifficulty = boss.objective.recovery
  const completions: { itemId: string; date: string; createdAt: string; id: string; recovery: number }[] = []
  for (const item of items) {
    for (const completion of completionsByItem[item.id] ?? []) {
      if (completion.date < encounter.windowStart || completion.date > last || !isMetCompletion(item, completion)) continue
      completions.push({
        itemId: item.id,
        date: completion.date,
        createdAt: completion.createdAt,
        id: completion.id,
        recovery: recoveryByDifficulty[item.difficulty],
      })
    }
  }
  completions.sort((left, right) => left.date.localeCompare(right.date)
    || left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
  const perDay = new Map<string, number>()
  const seen = new Set<string>()
  for (const completion of completions) {
    const itemDay = `${completion.itemId}:${completion.date}`
    if (seen.has(itemDay)) continue
    seen.add(itemDay)
    perDay.set(completion.date, (perDay.get(completion.date) ?? 0) + completion.recovery)
  }
  const goal = encounter.goal ?? 0
  let total = 0
  let reachedOn: string | undefined
  for (let day = encounter.windowStart; day <= last; day = shiftKey(day, 1)) {
    total += perDay.get(day) ?? 0
    if (!reachedOn && total >= goal) reachedOn = day
  }
  return { recovered: total, reachedOn }
}

export interface BossSummary {
  encounter: BossEncounter
  definition: BossDefinition
  kind: BossObjective['kind']
  /** Constancia: fechas completas y días necesarios. */
  completedDates: string[]
  target: number
  /** Golpes o piezas: progreso, meta y barras. */
  damage: number
  goal: number
  bars: BossBar[]
  guardHits: number
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
  const kind = definition.objective.kind
  const goal = encounter.goal ?? (definition.objective.kind === 'days' ? definition.objective.targetDays : 0)
  const completedDates = active && kind === 'days' ? completeDatesOf(encounter, items, completionsByItem, today) : []
  const progress = kind === 'hits' && active ? hitProgress(encounter, items, completionsByItem, today) : null
  const life = kind === 'lifeSteal' && active ? lifeProgress(encounter, items, completionsByItem, today) : null
  const pieces = kind === 'pieces' && active
    ? pieceProgress(encounter, items, completionsByItem, today)
    : { disabledZones: encounter.status === 'victory' ? encounter.zones ?? [] : [] }
  const damage = kind === 'hits'
    ? (active ? progress?.damage ?? 0 : (encounter.status === 'victory' ? goal : 0))
    : kind === 'pieces' ? pieces.disabledZones.length
      : kind === 'lifeSteal' ? (active ? life?.recovered ?? 0 : (encounter.status === 'victory' ? goal : 0))
        : 0
  const guardHits = kind === 'hits' && definition.objective.kind === 'hits' && definition.objective.guard
    ? (active ? (progress?.guardHits ?? 0)
      : (encounter.status === 'victory' ? definition.objective.guard.hits : 0))
    : 0
  return {
    encounter,
    definition,
    kind,
    completedDates,
    target: definition.objective.kind === 'days' ? definition.objective.targetDays : 0,
    damage,
    goal,
    bars: kind === 'hits'
      ? splitBars(definition, goal, damage, guardHits)
      : kind === 'pieces'
        ? (encounter.zones ?? []).map((zone) => ({
          name: zone,
          max: 1,
          hp: pieces.disabledZones.includes(zone) ? 0 : 1,
        }))
        : kind === 'lifeSteal' ? lifeBars(definition, goal, damage) : [],
    guardHits,
    daysLeft: active && encounter.windowEnd
      ? Math.max(0, differenceInCalendarDays(parseISO(encounter.windowEnd), parseISO(today)) + 1)
      : 0,
    today: evaluateBossDay(items, completionsByItem, today),
  }
}

/** ¿Esta tarea cuenta hoy para el boss activo? Sirve para destacarla en la interfaz. */
export function bossCountsFor(item: Item, encounter: BossEncounter | null, dateKey: string): boolean {
  if (!encounter || !isEffectActiveOn(encounter, dateKey)) return false
  return BOSSES[encounter.bossId].objective.kind === 'hits'
    ? !item.archived
    : BOSSES[encounter.bossId].objective.kind === 'pieces'
      ? Boolean(item.zone && encounter.zones?.includes(item.zone) && isBossDueOn(item, dateKey))
      : BOSSES[encounter.bossId].objective.kind === 'lifeSteal'
        ? !item.archived
        : isBossDueOn(item, dateKey)
}

/** Etiqueta corta de un efecto de entorno, para chips y placas. */
export function describeEffect(effect: EnvEffect): string {
  if (effect.kind === 'xpPercent') return `EXP −${100 - effect.percent}%`
  if (effect.kind === 'potionPercent') return `Poción −${100 - effect.percent}%`
  if (effect.kind === 'damagePercent') {
    return `Daño por fallo ×${(effect.percent / 100).toLocaleString('es-ES', { maximumFractionDigits: 2 })}`
  }
  if (effect.kind === 'hideTomorrow') return 'Niebla de rosas · Mañana oculta'
  return 'Relámpagos · EXP y daño ×2 en una zona'
}

/** Explicación completa de un efecto de entorno. */
export function describeEffectLong(effect: EnvEffect): string {
  if (effect.kind === 'xpPercent') return `Mientras esté activo, la EXP que ganas se reduce un ${100 - effect.percent} %.`
  if (effect.kind === 'potionPercent') return `Mientras esté activo, las pociones de vigor curan un ${100 - effect.percent} % menos.`
  if (effect.kind === 'damagePercent') {
    return `Mientras esté activo, el daño por fallo se multiplica por ${(effect.percent / 100).toLocaleString('es-ES', { maximumFractionDigits: 2 })}.`
  }
  if (effect.kind === 'hideTomorrow') return 'Una niebla de rosas oculta el panel de «Mañana» mientras el boss esté activo.'
  return 'Cada día una zona queda cargada: sus tareas dan el doble de EXP y causan el doble de daño por fallo.'
}

export function hidesTomorrow(boss: BossDefinition): boolean {
  return boss.effects.some((effect) => effect.kind === 'hideTomorrow')
}

/** Texto corto del avance: días conseguidos o daño hecho. */
export function encounterSummaryLine(summary: BossSummary): string {
  if (summary.kind === 'hits') return `${summary.damage}/${summary.goal} de daño`
  if (summary.kind === 'pieces') return `${summary.damage}/${summary.goal} piezas`
  if (summary.kind === 'lifeSteal') return `${summary.damage}/${summary.goal} de sangre recuperada`
  return `${summary.completedDates.length}/${summary.target} días`
}

/** Medidor del bestiario: victorias y derrotas por boss, calculadas desde los encuentros resueltos. */
export interface BestiaryEntry {
  bossId: BossId
  victories: number
  defeats: number
  firstVictoryOn?: string
}

export function bestiaryOf(encounters: BossEncounter[]): Record<BossId, BestiaryEntry> {
  const entries = Object.fromEntries(
    BOSS_IDS.map((id) => [id, { bossId: id, victories: 0, defeats: 0 } as BestiaryEntry]),
  ) as Record<BossId, BestiaryEntry>
  for (const encounter of encounters) {
    const entry = entries[encounter.bossId]
    if (!entry) continue
    if (encounter.status === 'victory') {
      entry.victories += 1
      if (encounter.resolvedOn && (!entry.firstVictoryOn || encounter.resolvedOn < entry.firstVictoryOn)) {
        entry.firstVictoryOn = encounter.resolvedOn
      }
    }
    if (encounter.status === 'defeat') entry.defeats += 1
  }
  return entries
}

/** Victorias necesarias para cada parte de la página del bestiario. */
export const BESTIARY_UNLOCKS = { page: 1, odds: 5, lore: 10, elite: 10, soul: 20 } as const

export type BestiaryUnlockKey = keyof typeof BESTIARY_UNLOCKS

export function bestiaryUnlocks(victories: number): Record<BestiaryUnlockKey, boolean> {
  return {
    page: victories >= BESTIARY_UNLOCKS.page,
    odds: victories >= BESTIARY_UNLOCKS.odds,
    lore: victories >= BESTIARY_UNLOCKS.lore,
    elite: victories >= BESTIARY_UNLOCKS.elite,
    soul: victories >= BESTIARY_UNLOCKS.soul,
  }
}

/** Cómo se vence al boss, en una frase derivada de su objetivo. */
export function bestiaryMechanic(boss: BossDefinition): string {
  if (boss.objective.kind === 'days') {
    return `Completa todas tus obligaciones durante ${boss.objective.targetDays} días dentro de una ventana de ${boss.windowDays} días.`
  }
  if (boss.objective.kind === 'pieces') {
    return `Desactiva hasta ${boss.objective.maxPieces} piezas ligadas a zonas cumpliendo sus obligaciones; Igor remienda una pieza cada día con deudas.`
  }
  if (boss.objective.kind === 'lifeSteal') {
    return 'Al aparecer roba hasta 10 puntos de vida; cada tarea cumplida recupera 1 punto y una tarea difícil recupera 2.'
  }
  if (boss.objective.guard) {
    const labels: Record<Difficulty, string> = {
      trivial: 'triviales',
      easy: 'fáciles',
      medium: 'medias',
      hard: 'difíciles',
    }
    const difficulties = boss.objective.guard.difficulties.map((difficulty) => labels[difficulty]).join(' o ')
    return `Rompe la cáscara con ${boss.objective.guard.hits} golpes de tareas ${difficulties}; después cualquier tarea hiere el núcleo.`
  }
  const order = boss.parts.length > 1 ? `, en orden: ${boss.parts.join(' y luego ')}` : ''
  return `Cada tarea cumplida le asesta un golpe${order}.`
}

/** Los registros anteriores guardaban un único recurso: se convierten al formato de premios. */
export function migrateEncounter(encounter: BossEncounter): BossEncounter {
  if (encounter.status === 'victory' && encounter.rewardGranted && !encounter.rewards) {
    return {
      ...encounter,
      rewards: {
        xp: 100,
        coins: 50,
        items: encounter.rewardResource ? { [encounter.rewardResource]: 1 } : {},
      },
    }
  }
  return encounter
}

export function rewardMultiplier(level: number): number {
  return 1 + 0.1 * Math.floor(level / 5)
}

/** Sortea cada objeto por separado; si no sale ninguno, concede el más probable. */
export function rollRewards(boss: BossDefinition, level: number, random: Random = Math.random): BossRewards {
  const multiplier = rewardMultiplier(level)
  let coins = Math.round(boss.reward.coins * multiplier)
  const items: BossRewards['items'] = {}
  const grant = (drop: DropEntry, quantity: number) => {
    if (drop.item === 'goldBag') coins += quantity
    else items[drop.item] = (items[drop.item] ?? 0) + quantity
  }
  let dropped = false
  for (const drop of boss.drops) {
    if (random() >= drop.chance) continue
    dropped = true
    grant(drop, randomInt(drop.min, drop.max, random))
  }
  if (!dropped && boss.drops.length > 0) {
    const likeliest = boss.drops.reduce((best, drop) => (drop.chance > best.chance ? drop : best))
    grant(likeliest, likeliest.min)
  }
  return { xp: Math.round(boss.reward.xp * multiplier), coins, items }
}

function newEncounter(
  bossId: BossId,
  sequence: number,
  status: 'scheduled' | 'cooldown',
  scheduledFor: string,
): BossEncounter {
  return {
    id: `enc:${sequence}`,
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
  rewards: BossRewards,
): { profile: PlayerProfile; leveledUp: boolean } {
  let { level, maxHp } = profile
  let xp = profile.xp + rewards.xp
  let leveledUp = false
  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level)
    level += 1
    maxHp += HP_PER_LEVEL
    leveledUp = true
  }
  const gained = (resource: BossResource) => rewards.items[resource] ?? 0
  const next: PlayerProfile = {
    ...profile,
    level,
    xp,
    maxHp,
    coins: profile.coins + rewards.coins,
    postponeTokens: profile.postponeTokens + gained('postponeToken'),
    vitalityPotions: profile.vitalityPotions + gained('vitalityPotion'),
    streakFreezes: profile.streakFreezes + gained('streakFreeze'),
    holyWater: (profile.holyWater ?? 0) + gained('holyWater'),
  }
  return {
    profile: leveledUp ? { ...next, hp: effectiveMaxHp(next) } : next,
    leveledUp,
  }
}

/** Boss que no puede esperar al sorteo porque se cumplió su disparador; null si ninguno. */
export function reactiveBoss(context: BossTriggerContext): BossId | null {
  return BOSS_IDS.find((id) => BOSSES[id].trigger?.(context)) ?? null
}

/** Sorteo ponderado del siguiente boss, sin repetir el último si hay otro disponible. */
export function pickBoss(previous: BossId | undefined, random: Random = Math.random): BossId {
  const pool = BOSS_IDS.length > 1 ? BOSS_IDS.filter((id) => id !== previous) : BOSS_IDS
  const total = pool.reduce((sum, id) => sum + BOSSES[id].weight, 0)
  let roll = random() * total
  for (const id of pool) {
    roll -= BOSSES[id].weight
    if (roll < 0) return id
  }
  return pool[pool.length - 1]
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

interface Verdict {
  won: boolean
  resolvedOn?: string
}

function verdictOf(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  today: string,
): Verdict {
  const boss = BOSSES[encounter.bossId]
  if (boss.objective.kind === 'days') {
    const dates = completeDatesOf(encounter, items, completionsByItem, today)
    const target = encounter.goal ?? boss.objective.targetDays
    return { won: dates.length >= target, resolvedOn: dates[target - 1] }
  }
  if (boss.objective.kind === 'pieces') {
    const progress = pieceProgress(encounter, items, completionsByItem, today)
    return { won: Boolean(progress.reachedOn), resolvedOn: progress.reachedOn }
  }
  if (boss.objective.kind === 'lifeSteal') {
    const progress = lifeProgress(encounter, items, completionsByItem, today)
    return { won: Boolean(progress.reachedOn), resolvedOn: progress.reachedOn }
  }
  const progress = hitProgress(encounter, items, completionsByItem, today)
  if (boss.objective.guard && (progress.guardHits ?? 0) < boss.objective.guard.hits) {
    return { won: false }
  }
  return { won: Boolean(progress.reachedOn), resolvedOn: progress.reachedOn }
}

/**
 * Avanza el ciclo del boss hasta hoy. Es idempotente: con los registros ya resueltos
 * (recompensa y daño marcados) una nueva evaluación no cambia nada.
 */
export function planBossSync(input: BossSyncInput): BossSyncResult {
  const { today, items, completionsByItem } = input
  const random = input.random ?? Math.random
  const changed = new Map<string, BossEncounter>()
  const records = new Map<string, BossEncounter>()
  for (const encounter of input.encounters) {
    const migrated = migrateEncounter(encounter)
    records.set(migrated.id, migrated)
    if (migrated !== encounter) changed.set(migrated.id, migrated)
  }
  let profile = input.profile
  let leveledUp = false

  const save = (encounter: BossEncounter) => {
    records.set(encounter.id, encounter)
    changed.set(encounter.id, encounter)
  }
  const finish = (): BossSyncResult => ({
    encounters: changed.size === 0 && profile === input.profile
      ? input.encounters
      : [...records.values()].sort((left, right) => left.sequence - right.sequence),
    changed: [...changed.values()],
    profile,
    leveledUp,
  })
  if (profile.dead) return { encounters: input.encounters, changed: [], profile, leveledUp: false }

  const tick = tickCurses(profile.curses, profile.hp, today)
  if (tick.changed) profile = { ...profile, curses: tick.curses, hp: tick.hp }

  let current = latestEncounter([...records.values()])
  // Sin encuentros, o con el último ya resuelto y sin sucesor (p. ej. tras renacer), se programa otro.
  if (!current || isResolved(current)) {
    const first = pickBoss(current?.bossId, random)
    current = newEncounter(
      first, (current?.sequence ?? 0) + 1, 'scheduled', shiftKey(today, rollDelay(BOSSES[first], random)),
    )
    save(current)
  }

  // Una resolución crea la siguiente aparición; el tope evita bucles tras una ausencia muy larga.
  for (let step = 0; step < 4 && current; step += 1) {
    if (isPending(current)) {
      if (today < current.scheduledFor) break
      const chosen = reactiveBoss({ today, profile, items, completionsByItem, encounters: [...records.values()] })
        ?? current.bossId
      const boss = BOSSES[chosen]
      const goal = boss.objective.kind === 'lifeSteal'
        ? initialLifeStolen(profile)
        : bossGoal(boss, items, today)
      if (boss.objective.kind === 'lifeSteal' && goal > 0) {
        profile = applyBossDamage(profile, goal)
      }
      current = {
        ...current,
        bossId: chosen,
        status: 'active',
        windowStart: today,
        windowEnd: shiftKey(today, boss.windowDays - 1),
        goal,
        zones: bossZones(boss, items),
      }
      save(current)
    }
    if (current.status !== 'active') break

    const boss = BOSSES[current.bossId]
    const verdict = verdictOf(current, items, completionsByItem, today)
    let resolved: BossEncounter | null = null
    if (verdict.won) {
      const rewards = rollRewards(boss, profile.level, random)
      const applied = applyBossReward(profile, rewards)
      profile = applied.profile
      leveledUp = leveledUp || applied.leveledUp
      resolved = {
        ...current, status: 'victory', resolvedOn: verdict.resolvedOn, rewardGranted: true, rewards,
      }
    } else if (today > (current.windowEnd as string)) {
      profile = applyBossDamage(profile, boss.defeatDamage)
      if (boss.defeatCurse && !profile.dead) {
        const curses = addCurse(profile.curses, boss.defeatCurse.id, boss.id, today, boss.defeatCurse.days)
        const cursed = { ...profile, curses }
        profile = { ...cursed, hp: Math.min(cursed.hp, effectiveMaxHp(cursed, today)) }
      }
      resolved = {
        ...current,
        status: 'defeat',
        resolvedOn: shiftKey(current.windowEnd as string, 1),
        damageApplied: true,
        curse: boss.defeatCurse?.id,
      }
    }
    if (!resolved) break

    const next = pickBoss(boss.id, random)
    const nextActivationOn = shiftKey(resolved.resolvedOn as string, rollDelay(boss, random))
    save({ ...resolved, nextActivationOn })
    current = newEncounter(next, resolved.sequence + 1, 'cooldown', nextActivationOn)
    save(current)
    if (profile.dead) break
  }

  return finish()
}
