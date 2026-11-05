import { differenceInCalendarDays, parseISO } from 'date-fns'
import type {
  BossEncounter,
  BossCategory,
  BossId,
  BossResource,
  BossRewards,
  BossCosmeticId,
  Completion,
  CurseId,
  DaySnapshot,
  Difficulty,
  DraculaPhase,
  Item,
  ItemEvent,
  PlayerProfile,
  RelicId,
  SoulPassiveActivation,
  SoulRank,
} from '../types'
import { addCurse, removeCurse, tickCurses } from './curses'
import { activityDateKey, shiftDateKey } from './date'
import { HP_PER_LEVEL, levelUpRecovery, xpToNextLevel } from './gamification'
import { collectSoul, hydraDawnHeal } from './souls'
import { createSoulPassiveActivation, soulPassiveRankOn } from './soulPassiveLedger'
import { resolvePlayerDamage } from './soulDamage'
import { isItemDueOn, isMetCompletion, isObligation, isWindowCompleted, windowDaysOf } from './recurrence'
import { effectiveMaxHp, MAX_ROUTE_LEVEL, ROUTE_IDS } from './routes'
import { streakEndingOn } from './streak'
import { eclipseMultiplierForDay } from './weather'

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
  | { kind: 'scythes'; target: number }
  | {
    kind: 'statues'
    load: { days: number; factor: number; min: number; max: number }
    dailyMin: number
    dailyMax: number
  }
  | {
    kind: 'heads'
    load: { factor: number; min: number; max: number }
    categories: BossCategory[]
  }
  | { kind: 'growingHeads'; initialHeads: number }
  | { kind: 'postponedTasks' }
  | { kind: 'duel' }
  | { kind: 'dracula' }

/** Efectos de entorno: rigen mientras el boss está activo. */
export type EnvEffect =
  | { kind: 'xpPercent'; percent: number }
  | { kind: 'potionPercent'; percent: number }
  | { kind: 'damagePercent'; percent: number }
  | { kind: 'hideTomorrow' }
  | { kind: 'disableFreeze' }
  | { kind: 'eternalNight' }
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
  defeatCurse?: { id: CurseId; days?: number; permanent?: boolean }
  reward: { xp: number; coins: number }
  drops: DropEntry[]
  /** Premio especial independiente de la tabla de consumibles y del consuelo. */
  specialDrop?: { name: string; chance: number; description: string }
  /** Texto específico para explicar una derrota cuando no hay daño directo adicional. */
  defeatText?: string
  /** Reliquia que se garantiza en la primera victoria de este boss en una expedición. */
  firstVictoryRelic?: RelicId
  /** Insignia permanente que se concede en la primera victoria de la cuenta. */
  firstVictoryCosmetic?: BossCosmeticId
  /** Maldición que este boss elimina al ser vencido en una revancha. */
  revengeCurse?: CurseId
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
  events?: ItemEvent[]
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
    firstVictoryRelic: 'rosary',
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
    firstVictoryRelic: 'silverMirror',
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
    firstVictoryRelic: 'heart',
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
    soulChance: 0.015,
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
  death: {
    id: 'death',
    name: 'Death',
    parts: ['Hozes'],
    grammar: { subject: 'Death', object: 'a Death', plural: false },
    mechanic: 'Reloj y apuesta',
    description: 'El señor de la muerte convierte cada obligación incumplida en una hoz más.',
    lore: 'Death no necesita perseguirte: solo espera a que el reloj agote sus cinco días. Puedes arriesgar oro para multiplicar el premio, pero cada deuda acerca una hoz al filo final.',
    soulChance: 0.015,
    windowDays: 5,
    objective: { kind: 'scythes', target: 5 },
    effects: [{ kind: 'disableFreeze' }],
    defeatDamage: 0,
    defeatCurse: { id: 'deathScythe', permanent: true },
    reward: { xp: 200, coins: 120 },
    drops: [
      { item: 'streakFreeze', chance: 0.45, min: 1, max: 1 },
      { item: 'holyWater', chance: 0.3, min: 1, max: 1 },
      { item: 'vitalityPotion', chance: 0.3, min: 1, max: 1 },
      { item: 'postponeToken', chance: 0.3, min: 1, max: 1 },
    ],
    defeatText: 'Cinco hoces marcan tu derrota',
    minDelay: 10,
    maxDelay: 15,
    weight: 1,
  },
  medusa: {
    id: 'medusa',
    name: 'Medusa',
    parts: ['Estatuas'],
    grammar: { subject: 'Medusa', object: 'a Medusa', plural: false },
    mechanic: 'Estatuas y olvido',
    description: 'La mirada de Medusa convierte tus obligaciones en estatuas y borra el rastro de tus victorias.',
    lore: 'Medusa no necesita perseguir a quien ya ha aprendido a ser constante. Espera a que una racha alcance los catorce días, petrifica las obligaciones de la ventana y guarda en sus serpientes cada deuda que no rompas.',
    soulChance: 0.025,
    windowDays: 5,
    objective: { kind: 'statues', load: { days: 2, factor: 1, min: 4, max: 14 }, dailyMin: 1, dailyMax: 3 },
    effects: [{ kind: 'disableFreeze' }],
    defeatDamage: 20,
    defeatCurse: { id: 'amnesia', permanent: true },
    revengeCurse: 'amnesia',
    reward: { xp: 140, coins: 80 },
    drops: [
      { item: 'streakFreeze', chance: 0.55, min: 1, max: 1 },
      { item: 'holyWater', chance: 0.25, min: 1, max: 1 },
      { item: 'postponeToken', chance: 0.25, min: 1, max: 1 },
      { item: 'vitalityPotion', chance: 0.2, min: 1, max: 1 },
    ],
    trigger: ({ today, items, completionsByItem }) => items.some((item) =>
      !item.archived
      && item.type !== 'todo'
      && streakEndingOn(item, completionsByItem[item.id] ?? [], today) >= 14),
    minDelay: 10,
    maxDelay: 15,
    weight: 1,
  },
  cerberus: {
    id: 'cerberus',
    name: 'Cerbero',
    parts: ['Obligaciones', 'Pergaminos', 'Misiones secundarias'],
    grammar: { subject: 'Cerbero', object: 'a Cerbero', plural: false },
    mechanic: 'Tres cabezas',
    description: 'El guardián de tres cabezas castiga cada categoría que dejas de atender.',
    lore: 'Cerbero custodia la entrada al inframundo. Sus tres fauces vigilan las obligaciones, los pergaminos y las misiones secundarias: cada una se debilita con tus avances y vuelve a crecer cuando abandonas su rastro.',
    soulChance: 0.025,
    windowDays: 5,
    objective: {
      kind: 'heads',
      load: { factor: 1, min: 1, max: 30 },
      categories: ['obligations', 'scrolls', 'sideQuests'],
    },
    effects: [{ kind: 'damagePercent', percent: 125 }],
    defeatDamage: 0,
    defeatCurse: { id: 'tripleBite', days: 5 },
    defeatText: 'El daño por fallo se multiplica por 1,5 durante 5 días',
    reward: { xp: 150, coins: 80 },
    drops: [
      { item: 'postponeToken', chance: 0.4, min: 1, max: 1 },
      { item: 'vitalityPotion', chance: 0.4, min: 1, max: 1 },
      { item: 'streakFreeze', chance: 0.4, min: 1, max: 1 },
      { item: 'holyWater', chance: 0.08, min: 1, max: 1 },
    ],
    trigger: ({ today, items, completionsByItem }) => {
      const cutoff = shiftKey(today, -6)
      const eligible = items.filter((item) =>
        !item.archived
        && item.type !== 'habit'
        && item.commitment === 'sideQuest'
        && activityDateKey(item.createdAt) <= cutoff)
      return eligible.length > 0 && !eligible.some((item) =>
        (completionsByItem[item.id] ?? []).some((completion) =>
          completion.date >= cutoff
          && completion.date <= today
          && isMetCompletion(item, completion)))
    },
    minDelay: 10,
    maxDelay: 15,
    weight: 1,
  },
  'hydra-scylla': {
    id: 'hydra-scylla',
    name: 'Hidra / Escila',
    parts: ['Cabezas'],
    grammar: { subject: 'La Hidra / Escila', object: 'a la Hidra / Escila', plural: false },
    mechanic: 'Cabezas que crecen',
    description: 'Una criatura de múltiples cabezas que vuelve a crecer con cada obligación incumplida.',
    lore: 'En las aguas turbias del castillo, cada deuda alimenta a la Hidra. Solo una jornada cerrada sin cabezas permite abatirla; las tareas cumplidas cortan sus cuellos, pero las obligaciones que vencen sin cumplirse hacen que vuelva a crecer.',
    soulChance: 0.03,
    windowDays: 5,
    objective: { kind: 'growingHeads', initialHeads: 3 },
    effects: [{ kind: 'potionPercent', percent: 50 }],
    defeatDamage: 0,
    defeatCurse: { id: 'hydraPoison', days: 5 },
    defeatText: 'Pierdes 1 de vida al día durante cinco días; una poción de vigor cura el veneno.',
    reward: { xp: 130, coins: 70 },
    drops: [
      { item: 'vitalityPotion', chance: 0.55, min: 1, max: 1 },
      { item: 'postponeToken', chance: 0.3, min: 1, max: 1 },
      { item: 'holyWater', chance: 0.2, min: 1, max: 1 },
      { item: 'streakFreeze', chance: 0.2, min: 1, max: 1 },
    ],
    trigger: ({ today, items, events = [], profile }) => {
      const cutoff = shiftKey(today, -9)
      const itemsById = new Map(items.map((item) => [item.id, item]))
      const counts = new Map<string, number>()
      for (const event of events) {
        const item = itemsById.get(event.itemId)
        const type = item?.type ?? event.itemType
        const commitment = item?.commitment ?? event.commitment
        if (event.kind !== 'missed' || type === 'habit' || commitment === 'sideQuest') continue
        if (profile.runStartedAt && (event.runStartedAt
          ? event.runStartedAt !== profile.runStartedAt
          : new Date(event.occurredAt) < new Date(profile.runStartedAt))) continue
        const zone = item?.zone
        if (!zone) continue
        const date = event.activityDate
          ?? shiftKey(event.scheduledDate, item ? windowDaysOf(item) - 1 : 0)
        if (date < cutoff || date > today) continue
        counts.set(zone, (counts.get(zone) ?? 0) + 1)
      }
      return [...counts.values()].some((misses) => misses >= 3)
    },
    minDelay: 10,
    maxDelay: 15,
    weight: 1,
  },
  doppelganger: {
    id: 'doppelganger',
    name: 'Doppelgänger',
    parts: ['Espejo'],
    grammar: { subject: 'El Doppelgänger', object: 'al Doppelgänger', plural: false },
    mechanic: 'Duelo contigo',
    description: 'Una copia exacta que solo cae cuando superas tu propio ritmo.',
    lore: 'El espejo no miente: enfrenta cada avance con los días que lo precedieron. Su reflejo se agrieta cuando superas tu ritmo sin acumular más fallos.',
    soulChance: 0.02,
    windowDays: 5,
    objective: { kind: 'duel' },
    effects: [],
    defeatDamage: 0,
    defeatCurse: { id: 'shadow', days: 10 },
    defeatText: 'Sombra reduce tu EXP un 10 % durante diez días.',
    firstVictoryRelic: 'silverMirror',
    reward: { xp: 160, coins: 80 },
    drops: [
      { item: 'postponeToken', chance: 0.3, min: 1, max: 1 },
      { item: 'streakFreeze', chance: 0.3, min: 1, max: 1 },
      { item: 'holyWater', chance: 0.2, min: 1, max: 1 },
    ],
    trigger: doppelgangerTrigger,
    minDelay: 10,
    maxDelay: 15,
    weight: 1,
  },
  sukamon: {
    id: 'sukamon',
    name: 'Sukamon',
    parts: ['Sukamon'],
    grammar: { subject: 'Sukamon', object: 'a Sukamon', plural: false },
    mechanic: 'Tareas aplazadas',
    description: 'El lodo de lo pospuesto te obliga a resolver lo que dejaste para mañana.',
    lore: 'Sukamon nace de cada aplazamiento y crece con lo que se queda pendiente. No basta con evitar nuevas demoras: hay que terminar todas las tareas que lo hicieron aparecer.',
    soulChance: 0,
    windowDays: 1,
    objective: { kind: 'postponedTasks' },
    effects: [],
    defeatDamage: 0,
    defeatText: 'Pierdes un sello de aplazamiento, si te queda alguno. Tu retrato queda cubierto de lodo durante un día',
    reward: { xp: 50, coins: 25 },
    drops: [],
    specialDrop: {
      name: 'Digivice',
      chance: 0.03,
      description: 'Solo puede obtenerse una vez por expedición y aún no tiene efecto.',
    },
    trigger: (context) => recentSukamonPostponements(context).length >= 3
      && sukamonTargetItemIds(context).length > 0,
    minDelay: 10,
    maxDelay: 15,
    weight: 0,
  },
  dracula: {
    id: 'dracula',
    name: 'Drácula',
    parts: ['Humano', 'Demonio', 'Murciélago'],
    grammar: { subject: 'Drácula', object: 'a Drácula', plural: false },
    mechanic: 'Tres fases',
    description: 'El señor del castillo cambia de forma y pone a prueba tu constancia, tus golpes y tu resistencia.',
    lore: 'El señor de la noche no se deja derrotar con un solo golpe. Primero te desafía con rostro humano, después revela su forma demoníaca y, cuando crees haber vencido, intenta escapar convertido en murciélago.',
    soulChance: 0.02,
    windowDays: 12,
    objective: { kind: 'dracula' },
    effects: [
      { kind: 'eternalNight' },
      { kind: 'damagePercent', percent: 150 },
    ],
    defeatDamage: 0,
    defeatCurse: { id: 'draculaMark', permanent: true },
    defeatText: 'La Marca de Drácula reduce tu vida máxima efectiva un 10 % hasta vencerlo en una revancha.',
    revengeCurse: 'draculaMark',
    reward: { xp: 400, coins: 200 },
    drops: [],
    firstVictoryCosmetic: 'nightCrown',
    minDelay: 10,
    maxDelay: 15,
    weight: 0,
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

export function protectionsDisabledOn(encounter: BossEncounter | null | undefined, dateKey: string): boolean {
  if (!encounter?.windowStart || !encounter.windowEnd) return false
  return dateKey >= encounter.windowStart
    && dateKey <= encounter.windowEnd
    && BOSSES[encounter.bossId].effects.some((effect) => effect.kind === 'disableFreeze')
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
  if (boss.objective.kind === 'dracula') {
    return clamp(Math.round(dailyLoad(items, today) * 4), 10, 80)
  }
  if (boss.objective.kind === 'pieces') return bossZones(boss, items).length
  if (boss.objective.kind === 'lifeSteal') return 0
  if (boss.objective.kind === 'scythes') return boss.objective.target
  if (boss.objective.kind === 'heads') {
    return Object.values(cerberusHeadGoals(items, today)).reduce((total, goal) => total + (goal ?? 0), 0)
  }
  if (boss.objective.kind === 'growingHeads') return boss.objective.initialHeads
  if (boss.objective.kind === 'postponedTasks') return 0
  if (boss.objective.kind === 'duel') return 0
  if (boss.objective.kind === 'statues') {
    const { days, factor, min, max } = boss.objective.load
    return clamp(Math.round(dailyLoad(items, today) * days * factor), min, max)
  }
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

export const BOSS_CATEGORY_LABELS: Record<BossCategory, string> = {
  obligations: 'Obligaciones',
  scrolls: 'Pergaminos',
  sideQuests: 'Misiones secundarias',
}

function cerberusCategory(item: Item): BossCategory | null {
  if (item.archived || item.type === 'habit') return null
  if (item.commitment === 'sideQuest') return 'sideQuests'
  if (item.type === 'todo') return 'scrolls'
  return isBossObligation(item) ? 'obligations' : null
}

function cerberusCategoryDueOn(item: Item, category: BossCategory, dateKey: string): boolean {
  return cerberusCategory(item) === category
    && activityDateKey(item.createdAt) <= dateKey
    && isItemDueOn(item, parseISO(dateKey))
}

function cerberusDailyLoad(items: Item[], category: BossCategory, today: string): number {
  const settled = items.filter((item) =>
    cerberusCategory(item) === category && activityDateKey(item.createdAt) <= shiftKey(today, -7),
  )
  const counts: number[] = []
  for (let offset = 14; offset >= 1; offset -= 1) {
    const date = shiftKey(today, -offset)
    counts.push(settled.filter((item) => cerberusCategoryDueOn(item, category, date)).length)
  }
  counts.sort((left, right) => left - right)
  return (counts[6] + counts[7]) / 2
}

export function cerberusHeadGoals(items: Item[], today: string): Partial<Record<BossCategory, number>> {
  const boss = BOSSES.cerberus
  if (boss.objective.kind !== 'heads') return {}
  const goals: Partial<Record<BossCategory, number>> = {}
  for (const category of boss.objective.categories) {
    const load = cerberusDailyLoad(items, category, today)
    goals[category] = clamp(
      Math.round(load * boss.windowDays * boss.objective.load.factor),
      boss.objective.load.min,
      boss.objective.load.max,
    )
  }
  return goals
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

export interface CerberusProgress {
  headsDown: number
  progress: number
  goal: number
  bars: BossBar[]
  reachedOn?: string
}

export interface HydraProgress {
  heads: number
  cut: number
  grown: number
  reachedOn?: string
}

export interface DoppelgangerProgress {
  previousCompletions: number
  currentCompletions: number
  targetCompletions: number
  previousMisses: number
  currentMisses: number
  won: boolean
  resolvedOn?: string
}

function eventDate(event: ItemEvent, itemsById: Map<string, Item>): string {
  if (event.activityDate) return event.activityDate
  const item = itemsById.get(event.itemId)
  return shiftKey(event.scheduledDate, item ? windowDaysOf(item) - 1 : 0)
}

function eventBelongsToRun(event: ItemEvent, runStartedAt?: string): boolean {
  if (!runStartedAt) return true
  return event.runStartedAt
    ? event.runStartedAt === runStartedAt
    : new Date(event.occurredAt) >= new Date(runStartedAt)
}

function lastSukamonDate(context: BossTriggerContext): string | undefined {
  const runStartedAt = context.profile.runStartedAt
  return context.encounters
    .filter((encounter) =>
      encounter.bossId === 'sukamon'
      && isResolved(encounter)
      && (!runStartedAt || new Date(encounter.createdAt) >= new Date(runStartedAt)),
    )
    .map((encounter) => encounter.resolvedOn ?? encounter.createdAt.slice(0, 10))
    .sort()
    .at(-1)
}

function recentSukamonPostponements(context: BossTriggerContext): ItemEvent[] {
  const cutoff = shiftKey(context.today, -6)
  const itemsById = new Map(context.items.map((item) => [item.id, item]))
  const lastEncounterDate = lastSukamonDate(context)
  return (context.events ?? []).filter((event) => {
    if (event.kind !== 'postponed' || !eventBelongsToRun(event, context.profile.runStartedAt)) return false
    const date = eventDate(event, itemsById)
    return date >= cutoff && date <= context.today && (!lastEncounterDate || date > lastEncounterDate)
  })
}

function sukamonTargetItemIds(context: BossTriggerContext): string[] {
  const itemsById = new Map(context.items.map((item) => [item.id, item]))
  const postponedIds = new Set(recentSukamonPostponements(context).map((event) => event.itemId))
  return [...postponedIds]
    .filter((id) => {
      const item = itemsById.get(id)
      return item !== undefined
        && !item.archived
        && !isWindowCompleted(item, context.completionsByItem[id] ?? [], context.today)
    })
    .sort()
}

export interface SukamonProgress {
  targetItemIds: string[]
  completedItemIds: string[]
  won: boolean
  resolvedOn?: string
}

export function sukamonProgress(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
): SukamonProgress {
  const targetItemIds = encounter.targetItemIds ?? []
  const itemsById = new Map(items.map((item) => [item.id, item]))
  const completedItemIds = targetItemIds.filter((id) => {
    const item = itemsById.get(id)
    return item !== undefined && (completionsByItem[id] ?? []).some((completion) =>
      completion.date === encounter.windowStart && isMetCompletion(item, completion),
    )
  })
  const won = targetItemIds.length > 0 && completedItemIds.length === targetItemIds.length
  return {
    targetItemIds,
    completedItemIds,
    won,
    ...(won ? { resolvedOn: encounter.windowStart } : {}),
  }
}

function completionCountInRange(
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  start: string,
  end: string,
  runStartedAt?: string,
): number {
  const runStart = runStartedAt?.slice(0, 10)
  let count = 0
  for (const item of items) {
    for (const completion of completionsByItem[item.id] ?? []) {
      if (completion.date < start || completion.date > end
        || (runStart && completion.date < runStart)
        || !isMetCompletion(item, completion)) continue
      count += 1
    }
  }
  return count
}

/** Progreso del duelo: compara cinco días completos con los cinco anteriores. */
export function doppelgangerProgress(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  events: ItemEvent[],
  today: string,
  runStartedAt?: string,
): DoppelgangerProgress {
  if (!encounter.windowStart || !encounter.windowEnd) {
    return {
      previousCompletions: 0,
      currentCompletions: 0,
      targetCompletions: 1,
      previousMisses: 0,
      currentMisses: 0,
      won: false,
    }
  }
  const currentEnd = encounter.windowEnd < today ? encounter.windowEnd : today
  const previousStart = shiftKey(encounter.windowStart, -5)
  const previousEnd = shiftKey(encounter.windowStart, -1)
  const previousCompletions = completionCountInRange(
    items, completionsByItem, previousStart, previousEnd, runStartedAt,
  )
  const currentCompletions = completionCountInRange(
    items, completionsByItem, encounter.windowStart, currentEnd, runStartedAt,
  )
  const itemsById = new Map(items.map((item) => [item.id, item]))
  const missedCounts = (start: string, end: string) => events.filter((event) => {
    if (event.kind !== 'missed' || !eventBelongsToRun(event, runStartedAt)) return false
    const date = eventDate(event, itemsById)
    return date >= start && date <= end
  }).length
  const previousMisses = missedCounts(previousStart, previousEnd)
  const currentMisses = missedCounts(encounter.windowStart, currentEnd)
  const targetCompletions = Math.max(1, Math.ceil(previousCompletions * 1.1))
  const closed = today > encounter.windowEnd
  const won = closed
    && currentCompletions >= targetCompletions
    && currentMisses <= previousMisses
  return {
    previousCompletions,
    currentCompletions,
    targetCompletions,
    previousMisses,
    currentMisses,
    won,
    ...(won ? { resolvedOn: encounter.windowEnd } : {}),
  }
}

function doppelgangerTrigger(context: BossTriggerContext): boolean {
  const { today, profile, items, completionsByItem, encounters } = context
  const priorDoppelganger = encounters
    .filter((encounter) => encounter.bossId === 'doppelganger' && encounter.resolvedOn)
    .map((encounter) => encounter.resolvedOn as string)
    .sort()
    .at(-1)
  const routeAdvanced = Object.values(profile.routes).some((route) => {
    if (route.level <= 0 || !route.windowStart) return false
    const completedOn = shiftKey(route.windowStart, -1)
    const since = priorDoppelganger
      ?? profile.runStartedAt?.slice(0, 10)
      ?? route.startedOn
      ?? today
    return (priorDoppelganger ? completedOn > since : completedOn >= since)
      && completedOn <= today
  })

  const runStart = profile.runStartedAt?.slice(0, 10)
  const firstRangeStart = shiftKey(today, -29)
  const firstRangeEnd = shiftKey(today, -23)
  const lastRangeStart = shiftKey(today, -6)
  const firstAverage = completionCountInRange(
    items, completionsByItem, firstRangeStart, firstRangeEnd, profile.runStartedAt,
  ) / 7
  const lastAverage = completionCountInRange(
    items, completionsByItem, lastRangeStart, today, profile.runStartedAt,
  ) / 7
  const stableRhythm = firstAverage > 0
    && lastAverage > 0
    && Math.abs(lastAverage - firstAverage) / firstAverage <= 0.1
  return routeAdvanced || (Boolean(runStart) && stableRhythm)
}

/** Hidra: cada completado corta una cabeza y cada obligación fallida al cerrar crece otra. */
export function hydraProgress(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  events: ItemEvent[],
  today: string,
  runStartedAt?: string,
): HydraProgress {
  const boss = BOSSES['hydra-scylla']
  if (boss.objective.kind !== 'growingHeads' || !encounter.windowStart || !encounter.windowEnd) {
    return { heads: 0, cut: 0, grown: 0 }
  }
  const initialHeads = encounter.goal ?? boss.objective.initialHeads
  const last = encounter.status === 'victory' && encounter.resolvedOn
    ? encounter.resolvedOn
    : encounter.windowEnd < today ? encounter.windowEnd : today
  const itemsById = new Map(items.map((item) => [item.id, item]))
  const missesByDate = new Map<string, number>()
  for (const event of events) {
    const item = itemsById.get(event.itemId)
    const type = item?.type ?? event.itemType
    const commitment = item?.commitment ?? event.commitment
    if (event.kind !== 'missed' || type === 'habit' || commitment === 'sideQuest'
      || !eventBelongsToRun(event, runStartedAt)) continue
    const date = eventDate(event, itemsById)
    if (date < encounter.windowStart || date > encounter.windowEnd) continue
    missesByDate.set(date, (missesByDate.get(date) ?? 0) + 1)
  }

  let heads = initialHeads
  let cut = 0
  let grown = 0
  let reachedOn: string | undefined
  for (let date = encounter.windowStart; date <= last; date = shiftKey(date, 1)) {
    const completedToday = new Set<string>()
    for (const item of items) {
      const completion = (completionsByItem[item.id] ?? []).find((candidate) =>
        candidate.date === date && isMetCompletion(item, candidate),
      )
      if (completion) completedToday.add(item.id)
    }
    const cutToday = Math.min(heads, completedToday.size)
    heads -= cutToday
    cut += cutToday
    if (date < today) {
      const grownToday = missesByDate.get(date) ?? 0
      heads += grownToday
      grown += grownToday
      if (heads === 0) {
        reachedOn = date
        break
      }
    }
  }
  return { heads, cut, grown, reachedOn }
}

export function cerberusProgress(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  today: string,
): CerberusProgress {
  const boss = BOSSES.cerberus
  if (boss.objective.kind !== 'heads' || !encounter.windowStart || !encounter.windowEnd) {
    return { headsDown: 0, progress: 0, goal: 0, bars: [] }
  }
  const goals = encounter.headGoals ?? cerberusHeadGoals(items, encounter.windowStart)
  const progress: Partial<Record<BossCategory, number>> = {}
  for (const category of boss.objective.categories) progress[category] = 0
  let reachedOn: string | undefined
  const last = encounter.status === 'victory' && encounter.resolvedOn
    ? encounter.resolvedOn
    : encounter.windowEnd < today ? encounter.windowEnd : today

  for (let date = encounter.windowStart; date <= last; date = shiftKey(date, 1)) {
    for (const category of boss.objective.categories) {
      let completed = 0
      for (const item of items) {
        if (cerberusCategory(item) !== category || activityDateKey(item.createdAt) > date) continue
        if ((completionsByItem[item.id] ?? []).some((completion) =>
          completion.date === date && isMetCompletion(item, completion),
        )) completed += 1
      }
      const goal = goals[category] ?? 1
      const current = progress[category] ?? 0
      progress[category] = completed > 0
        ? clamp(current + completed, 0, goal)
        : Math.max(0, current - 1)
    }
    if (!reachedOn && boss.objective.categories.every((category) =>
      (progress[category] ?? 0) >= (goals[category] ?? 1),
    )) reachedOn = date
  }

  const bars = boss.objective.categories.map((category) => {
    const goal = goals[category] ?? 1
    const current = progress[category] ?? 0
    return {
      name: BOSS_CATEGORY_LABELS[category],
      max: goal,
      hp: Math.max(0, goal - current),
    }
  })
  return {
    headsDown: bars.filter((bar) => bar.hp === 0).length,
    progress: bars.reduce((total, bar) => total + (bar.max - bar.hp), 0),
    goal: bars.reduce((total, bar) => total + bar.max, 0),
    bars,
    reachedOn,
  }
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

export interface ScytheProgress {
  scythes: number
  reachedOn?: string
}

export function scytheProgress(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  today: string,
): ScytheProgress {
  if (!encounter.windowStart || !encounter.windowEnd) return { scythes: 0 }
  const last = encounter.windowEnd < today ? encounter.windowEnd : today
  let scythes = 0
  let reachedOn: string | undefined
  for (let day = encounter.windowStart; day <= last; day = shiftKey(day, 1)) {
    for (const item of items) {
      if (!isBossDueOn(item, day) || isWindowCompleted(item, completionsByItem[item.id] ?? [], day)) continue
      scythes += 1
      if (!reachedOn && scythes >= 5) reachedOn = day
    }
  }
  return { scythes, reachedOn }
}

export interface StatueProgress {
  broken: number
  missed: number
  net: number
  reachedOn?: string
}

function stableHash(value: string): number {
  return [...value].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7)
}

/** Obligaciones convertidas en estatuas en un día concreto de una aparición. */
export function statueItemsOn(
  encounter: BossEncounter,
  items: Item[],
  dateKey: string,
): Item[] {
  if (encounter.bossId !== 'medusa' || !encounter.windowStart || !encounter.windowEnd
    || dateKey < encounter.windowStart || dateKey > encounter.windowEnd) return []
  const boss = BOSSES.medusa
  if (boss.objective.kind !== 'statues') return []
  const candidates = items
    .filter((item) => isBossDueOn(item, dateKey))
    .sort((left, right) => stableHash(`${encounter.id}:${dateKey}:${left.id}`)
      - stableHash(`${encounter.id}:${dateKey}:${right.id}`) || left.id.localeCompare(right.id))
  const count = Math.min(candidates.length, randomInt(boss.objective.dailyMin, boss.objective.dailyMax, () =>
    stableHash(`${encounter.id}:${dateKey}:count`) / 0x100000000))
  return candidates.slice(0, count)
}

export function isMedusaStatueOn(
  encounter: BossEncounter | null | undefined,
  item: Item,
  dateKey: string,
  allItems: Item[] = [item],
): boolean {
  return Boolean(encounter && statueItemsOn(encounter, allItems, dateKey).some((candidate) => candidate.id === item.id))
}

/** Progreso de Medusa, derivado de estatuas seleccionadas y completados reales. */
export function statueProgress(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  today: string,
): StatueProgress {
  if (!encounter.windowStart || !encounter.windowEnd) return { broken: 0, missed: 0, net: 0 }
  const last = encounter.windowEnd < today ? encounter.windowEnd : today
  let broken = 0
  let missed = 0
  let reachedOn: string | undefined
  for (let day = encounter.windowStart; day <= last; day = shiftKey(day, 1)) {
    const statues = statueItemsOn(encounter, items, day)
    broken += statues.filter((item) =>
      isWindowCompleted(item, completionsByItem[item.id] ?? [], day)).length
    if (day < today || encounter.windowEnd < today) {
      missed += statues.filter((item) =>
        !isWindowCompleted(item, completionsByItem[item.id] ?? [], day)).length
    }
    const net = Math.max(0, broken - missed)
    if (!reachedOn && encounter.goal && net >= encounter.goal) reachedOn = day
  }
  return { broken, missed, net: Math.max(0, broken - missed), reachedOn }
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
  damageOverride?: Record<Difficulty, number>,
): HitProgress {
  const boss = BOSSES[encounter.bossId]
  const table = damageOverride ?? (boss.objective.kind === 'hits' ? boss.objective.damage : undefined)
  const guard = boss.objective.kind === 'hits' ? boss.objective.guard : undefined
  if (!table || !encounter.windowStart || !encounter.windowEnd) return { damage: 0 }
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

export const DRACULA_PHASE_LABELS: Record<DraculaPhase, string> = {
  human: 'Humano',
  bat: 'Murciélago',
  demon: 'Demonio',
}

const DRACULA_DAMAGE: Record<Difficulty, number> = {
  trivial: 1,
  easy: 2,
  medium: 3,
  hard: 5,
}

export interface DraculaProgress {
  phase: DraculaPhase
  phaseStartedOn: string
  phaseEndsOn: string
  completedPhases: DraculaPhase[]
  progress: number
  goal: number
  missed: boolean
  verdict?: { won: boolean; lost?: boolean; resolvedOn?: string }
}

function phaseEncounter(
  encounter: BossEncounter,
  phaseStartedOn: string,
  phaseEndsOn: string,
  goal: number,
): BossEncounter {
  return {
    ...encounter,
    windowStart: phaseStartedOn,
    windowEnd: phaseEndsOn,
    goal,
  }
}

/** Recalcula la fase actual y sus transiciones desde los datos reales del encuentro. */
export function draculaProgress(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  events: ItemEvent[],
  today: string,
  runStartedAt?: string,
): DraculaProgress {
  const encounterStart = encounter.windowStart ?? today
  const humanEnd = shiftKey(encounterStart, 3)
  const humanWindow = phaseEncounter(encounter, encounterStart, humanEnd, 2)
  const completeDates = completeDatesOf(humanWindow, items, completionsByItem, today)
  const completedPhases: DraculaPhase[] = []

  if (completeDates.length < 2) {
    return {
      phase: 'human',
      phaseStartedOn: encounterStart,
      phaseEndsOn: humanEnd,
      completedPhases,
      progress: completeDates.length,
      goal: 2,
      missed: false,
      ...(today > humanEnd
        ? { verdict: { won: false, lost: true, resolvedOn: shiftKey(humanEnd, 1) } }
        : {}),
    }
  }

  completedPhases.push('human')
  const batStart = shiftKey(completeDates[1], 1)
  const batEnd = shiftKey(batStart, 3)
  const batGoal = encounter.draculaBatGoal ?? encounter.draculaDemonGoal ?? 10
  const batWindow = phaseEncounter(encounter, batStart, batEnd, batGoal)
  const batDamage = hitProgress(
    batWindow,
    items,
    completionsByItem,
    today,
    DRACULA_DAMAGE,
  )

  if (!batDamage.reachedOn) {
    return {
      phase: 'bat',
      phaseStartedOn: batStart,
      phaseEndsOn: batEnd,
      completedPhases,
      progress: batDamage.damage,
      goal: batGoal,
      missed: false,
      ...(today > batEnd
        ? { verdict: { won: false, lost: true, resolvedOn: shiftKey(batEnd, 1) } }
        : {}),
    }
  }

  completedPhases.push('bat')
  const demonStart = shiftKey(batDamage.reachedOn, 1)
  const demonEnd = shiftKey(demonStart, 3)
  const through = today < demonEnd ? today : demonEnd
  const itemsById = new Map(items.map((item) => [item.id, item]))
  const missed = events.some((event) => {
    if (event.kind !== 'missed' || !eventBelongsToRun(event, runStartedAt)) return false
    const date = eventDate(event, itemsById)
    if (date < demonStart || date > through) return false
    const item = itemsById.get(event.itemId)
    const type = item?.type ?? event.itemType
    const commitment = item?.commitment ?? event.commitment
    return type !== 'habit' && commitment !== 'sideQuest'
  })
  const elapsedDays = through < demonStart
    ? 0
    : differenceInCalendarDays(parseISO(through), parseISO(demonStart)) + 1
  const demonProgress = missed ? 0 : Math.min(4, elapsedDays)
  if (today > demonEnd && !missed) completedPhases.push('demon')

  return {
    phase: 'demon',
    phaseStartedOn: demonStart,
    phaseEndsOn: demonEnd,
    completedPhases,
    progress: demonProgress,
    goal: 4,
    missed,
    ...(today > demonEnd
      ? missed
        ? { verdict: { won: false, lost: true, resolvedOn: shiftKey(demonEnd, 1) } }
        : { verdict: { won: true, resolvedOn: demonEnd } }
      : {}),
  }
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
  scythes: number
  headsDown: number
  headsRemaining: number
  headsCut: number
  headsGrown: number
  statuesBroken: number
  statuesMissed: number
  duel?: DoppelgangerProgress
  sukamon?: SukamonProgress
  dracula?: DraculaProgress
  /** Días que quedan de la ventana, contando hoy; 0 si no está activo. */
  daysLeft: number
  today: BossDayStatus
}

export function summarizeBoss(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  today: string,
  events: ItemEvent[] = [],
  runStartedAt?: string,
): BossSummary {
  const definition = BOSSES[encounter.bossId]
  const active = encounter.status === 'active'
  const kind = definition.objective.kind
  const dracula = kind === 'dracula'
    ? draculaProgress(encounter, items, completionsByItem, events, today, runStartedAt)
    : null
  const goal = dracula?.goal ?? encounter.goal ?? (
    definition.objective.kind === 'days' || definition.objective.kind === 'scythes'
      ? definition.objective.kind === 'days' ? definition.objective.targetDays : definition.objective.target
      : definition.objective.kind === 'heads'
        ? Object.values(cerberusHeadGoals(items, encounter.windowStart ?? today))
          .reduce((total, headGoal) => total + (headGoal ?? 0), 0)
      : definition.objective.kind === 'growingHeads' ? definition.objective.initialHeads
      : definition.objective.kind === 'statues' ? 0
      : 0
  )
  const completedDates = active && kind === 'days' ? completeDatesOf(encounter, items, completionsByItem, today) : []
  const progress = kind === 'hits' && active ? hitProgress(encounter, items, completionsByItem, today) : null
  const life = kind === 'lifeSteal' && active ? lifeProgress(encounter, items, completionsByItem, today) : null
  const scythes = kind === 'scythes' && active ? scytheProgress(encounter, items, completionsByItem, today) : null
  const statues = kind === 'statues' && active ? statueProgress(encounter, items, completionsByItem, today) : null
  const heads = kind === 'heads' ? cerberusProgress(encounter, items, completionsByItem, today) : null
  const hydra = kind === 'growingHeads'
    ? hydraProgress(encounter, items, completionsByItem, events, today, runStartedAt)
    : null
  const duel = kind === 'duel'
    ? doppelgangerProgress(encounter, items, completionsByItem, events, today, runStartedAt)
    : null
  const sukamon = kind === 'postponedTasks'
    ? sukamonProgress(encounter, items, completionsByItem)
    : null
  const pieces = kind === 'pieces' && active
    ? pieceProgress(encounter, items, completionsByItem, today)
    : { disabledZones: encounter.status === 'victory' ? encounter.zones ?? [] : [] }
  const damage = kind === 'dracula' ? (dracula?.progress ?? 0)
    : kind === 'hits'
    ? (active ? progress?.damage ?? 0 : (encounter.status === 'victory' ? goal : 0))
    : kind === 'pieces' ? pieces.disabledZones.length
      : kind === 'lifeSteal' ? (active ? life?.recovered ?? 0 : (encounter.status === 'victory' ? goal : 0))
        : kind === 'scythes' ? (active ? scythes?.scythes ?? 0 : (encounter.status === 'defeat' ? 5 : 0))
          : kind === 'statues' ? (active ? statues?.net ?? 0 : (encounter.status === 'victory' ? goal : 0))
            : kind === 'heads' ? (heads?.progress ?? 0)
              : kind === 'growingHeads' ? (hydra?.heads ?? 0)
                : kind === 'duel' ? (duel?.currentCompletions ?? 0)
                  : kind === 'postponedTasks' ? (sukamon?.completedItemIds.length ?? 0)
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
    goal: sukamon?.targetItemIds.length ?? duel?.targetCompletions ?? goal,
    bars: kind === 'dracula' && dracula
      ? [{
        name: `${DRACULA_PHASE_LABELS[dracula.phase]} · ${dracula.phase === 'bat' ? 'daño' : 'días'}`,
        max: dracula.goal,
        hp: Math.min(dracula.progress, dracula.goal),
      }]
      : kind === 'hits'
      ? splitBars(definition, goal, damage, guardHits)
      : kind === 'pieces'
        ? (encounter.zones ?? []).map((zone) => ({
          name: zone,
          max: 1,
          hp: pieces.disabledZones.includes(zone) ? 0 : 1,
        }))
        : kind === 'lifeSteal' ? lifeBars(definition, goal, damage)
          : kind === 'scythes' ? [{ name: 'Hozes', max: 5, hp: damage }]
              : kind === 'statues' ? [{ name: 'Estatuas', max: goal, hp: Math.max(0, goal - damage) }]
                : kind === 'heads' ? heads?.bars ?? []
                  : kind === 'growingHeads' ? [{
                    name: 'Cabezas',
                    max: Math.max(definition.objective.kind === 'growingHeads' ? definition.objective.initialHeads : 1, hydra?.heads ?? 0),
                    hp: hydra?.heads ?? 0,
                  }]
                    : kind === 'duel' ? [{
                      name: 'Completados',
                      max: duel?.targetCompletions ?? 1,
                      hp: Math.min(duel?.currentCompletions ?? 0, duel?.targetCompletions ?? 1),
                    }]
                      : kind === 'postponedTasks' && sukamon ? sukamon.targetItemIds.map((id) => ({
                        name: items.find((item) => item.id === id)?.title ?? 'Tarea pendiente',
                        max: 1,
                        hp: sukamon.completedItemIds.includes(id) ? 0 : 1,
                      }))
                        : [],
    guardHits,
    scythes: damage,
    headsDown: heads?.headsDown ?? (encounter.status === 'victory' && kind === 'heads' ? 3 : 0),
    headsRemaining: hydra?.heads ?? (encounter.status === 'victory' && kind === 'growingHeads' ? 0 : 0),
    headsCut: hydra?.cut ?? 0,
    headsGrown: hydra?.grown ?? 0,
    statuesBroken: statues?.broken ?? (encounter.status === 'victory' && kind === 'statues' ? goal : 0),
    statuesMissed: statues?.missed ?? 0,
    duel: duel ?? undefined,
    sukamon: sukamon ?? undefined,
    dracula: dracula ?? undefined,
    daysLeft: active && encounter.windowEnd
      ? Math.max(0, differenceInCalendarDays(parseISO(encounter.windowEnd), parseISO(today)) + 1)
      : 0,
    today: evaluateBossDay(items, completionsByItem, today),
  }
}

/** ¿Esta tarea cuenta hoy para el boss activo? Sirve para destacarla en la interfaz. */
export function bossCountsFor(item: Item, encounter: BossEncounter | null, dateKey: string): boolean {
  if (!encounter || !isEffectActiveOn(encounter, dateKey)) return false
  const objective = BOSSES[encounter.bossId].objective
  if (objective.kind === 'heads') {
    const category = cerberusCategory(item)
    return category !== null && cerberusCategoryDueOn(item, category, dateKey)
  }
  if (objective.kind === 'growingHeads') return !item.archived
  if (objective.kind === 'postponedTasks') return encounter.targetItemIds?.includes(item.id) === true
  if (objective.kind === 'duel') return !item.archived
  if (objective.kind === 'dracula') {
    if (encounter.draculaPhase === 'bat') return !item.archived
    const isObligation = item.type !== 'habit' && item.commitment !== 'sideQuest'
    return isObligation && isBossDueOn(item, dateKey)
  }
  return objective.kind === 'hits'
    ? !item.archived
    : objective.kind === 'pieces'
      ? Boolean(item.zone && encounter.zones?.includes(item.zone) && isBossDueOn(item, dateKey))
      : objective.kind === 'lifeSteal'
        ? !item.archived
        : objective.kind === 'scythes'
          ? isBossDueOn(item, dateKey)
          : objective.kind === 'statues'
            ? isBossDueOn(item, dateKey)
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
  if (effect.kind === 'disableFreeze') return 'Mirada · protecciones bloqueadas'
  if (effect.kind === 'eternalNight') return 'Noche eterna'
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
  if (effect.kind === 'disableFreeze') return 'Las congelaciones de racha y el escudo no protegen los fallos mientras este efecto esté activo.'
  if (effect.kind === 'eternalNight') return 'La noche permanece sobre el castillo durante todo el encuentro.'
  return 'Cada día una zona queda cargada: sus tareas dan el doble de EXP y causan el doble de daño por fallo.'
}

export function hidesTomorrow(boss: BossDefinition): boolean {
  return boss.effects.some((effect) => effect.kind === 'hideTomorrow')
}

/** Texto corto del avance: días conseguidos o daño hecho. */
export function encounterSummaryLine(summary: BossSummary): string {
  if (summary.kind === 'dracula' && summary.dracula) {
    const phase = DRACULA_PHASE_LABELS[summary.dracula.phase]
    return `${phase}: ${summary.dracula.progress}/${summary.dracula.goal}${summary.dracula.phase === 'bat' ? ' de daño' : ' días'}`
  }
  if (summary.kind === 'hits') return `${summary.damage}/${summary.goal} de daño`
  if (summary.kind === 'pieces') return `${summary.damage}/${summary.goal} piezas`
  if (summary.kind === 'lifeSteal') return `${summary.damage}/${summary.goal} de sangre recuperada`
  if (summary.kind === 'scythes') return `${summary.damage}/${summary.goal} hoces`
  if (summary.kind === 'statues') return `${summary.damage}/${summary.goal} estatuas`
  if (summary.kind === 'heads') return `${summary.headsDown}/3 cabezas derrotadas`
  if (summary.kind === 'growingHeads') return `${summary.headsRemaining} cabezas restantes`
  if (summary.kind === 'postponedTasks' && summary.sukamon) {
    return `${summary.sukamon.completedItemIds.length}/${summary.sukamon.targetItemIds.length} tareas aplazadas`
  }
  if (summary.kind === 'duel' && summary.duel) {
    return `${summary.duel.currentCompletions}/${summary.duel.targetCompletions} completados · ${summary.duel.currentMisses}/${summary.duel.previousMisses} fallos`
  }
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
  if (boss.objective.kind === 'dracula') {
    return 'Supera tres fases de hasta cuatro días: completa dos días con todas tus obligaciones, inflige daño según la dificultad de las tareas mientras Drácula es murciélago y termina cuatro días sin fallos de obligaciones ni pergaminos en su forma demoníaca. Las fases siguientes comienzan al día operativo posterior a superar la anterior.'
  }
  if (boss.objective.kind === 'days') {
    return `Completa todas tus obligaciones durante ${boss.objective.targetDays} días dentro de una ventana de ${boss.windowDays} días.`
  }
  if (boss.objective.kind === 'pieces') {
    return `Desactiva hasta ${boss.objective.maxPieces} piezas ligadas a zonas cumpliendo sus obligaciones; Igor remienda una pieza cada día con deudas.`
  }
  if (boss.objective.kind === 'lifeSteal') {
    return 'Al aparecer roba hasta 10 puntos de vida; cada tarea cumplida recupera 1 punto y una tarea difícil recupera 2.'
  }
  if (boss.objective.kind === 'scythes') {
    return 'Cada obligación incumplida suma una hoz; con cinco hoces pierdes, y con menos de cinco al acabar los 5 días vences.'
  }
  if (boss.objective.kind === 'statues') {
    return 'Cada mañana convierte 1–3 obligaciones en estatuas: rómpelas con completados y alcanza la meta antes de que las deudas curen a Medusa.'
  }
  if (boss.objective.kind === 'heads') {
    return 'Cada cabeza vigila una categoría y pierde un punto por cada tarea completada; si un día no completas nada de su categoría, recupera un punto. Derriba las tres dentro de la ventana.'
  }
  if (boss.objective.kind === 'growingHeads') {
    return `Empieza con ${boss.objective.initialHeads} cabezas. Cada tarea cumplida corta una; cada obligación que termina sin completar hace crecer otra.`
  }
  if (boss.objective.kind === 'postponedTasks') {
    return 'Completa durante hoy todas las tareas aplazadas pendientes que hicieron aparecer a Sukamon.'
  }
  if (boss.objective.kind === 'duel') {
    return 'Compara todos los completados de los cinco días del encuentro con los cinco anteriores: alcanza al menos un 10 % más (mínimo uno si antes no hubo completados) y no acumules más fallos.'
  }
  if (boss.objective.kind === 'hits' && boss.objective.guard) {
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

export function applyBossDamage(
  profile: PlayerProfile,
  damage: number,
  dateKey: string,
  deathRank: SoulRank | 0 = 0,
  deathSavesUsed = 0,
): PlayerProfile {
  const resolution = resolvePlayerDamage(
    profile.hp,
    Math.ceil(damage * eclipseMultiplierForDay(dateKey)),
    deathRank,
    deathSavesUsed,
  )
  const hp = resolution.hp
  return { ...profile, hp, dead: hp === 0 }
}

export function eclipseAdjustedRewards(rewards: BossRewards, dateKey: string): BossRewards {
  const multiplier = eclipseMultiplierForDay(dateKey)
  return {
    ...rewards,
    xp: rewards.xp * multiplier,
    coins: rewards.coins * multiplier,
  }
}

export function applyBossRevenge(profile: PlayerProfile, boss: BossDefinition): PlayerProfile {
  if (!boss.revengeCurse) return profile
  return {
    ...profile,
    curses: removeCurse(profile.curses, boss.revengeCurse),
    penanceProgress: { ...(profile.penanceProgress ?? {}), [boss.revengeCurse]: 0 },
  }
}

/** Misma progresión que una completación normal: sube niveles y recupera media vida máxima. */
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
    profile: leveledUp
      ? {
          ...next,
          hp: Math.min(effectiveMaxHp(next), profile.hp + levelUpRecovery(effectiveMaxHp(next))),
        }
      : next,
    leveledUp,
  }
}

function firstVictoryInRun(
  encounters: BossEncounter[],
  bossId: BossId,
  runStartedAt: string | undefined,
): boolean {
  const runStart = runStartedAt?.slice(0, 10)
  return encounters.some((encounter) =>
    encounter.bossId === bossId
    && encounter.status === 'victory'
    && (!runStart || (encounter.resolvedOn ?? encounter.createdAt.slice(0, 10)) >= runStart))
}

function legionVictoriesInRun(
  encounters: BossEncounter[],
  runStartedAt: string | undefined,
): number {
  const runStart = runStartedAt?.slice(0, 10)
  return encounters.filter((encounter) =>
    encounter.bossId === 'legion'
    && encounter.status === 'victory'
    && (!runStart || (encounter.resolvedOn ?? encounter.createdAt.slice(0, 10)) >= runStart),
  ).length
}

/** Boss que no puede esperar al sorteo porque se cumplió su disparador; null si ninguno. */
export function reactiveBoss(context: BossTriggerContext): BossId | null {
  if (BOSSES.sukamon.trigger?.(context)) return 'sukamon'
  return BOSS_IDS.find((id) => BOSSES[id].trigger?.(context)) ?? null
}

/** Sorteo ponderado del siguiente boss, sin repetir el último si hay otro disponible. */
export function pickBoss(previous: BossId | undefined, random: Random = Math.random): BossId {
  const eligible = BOSS_IDS.filter((id) => BOSSES[id].weight > 0)
  const alternatives = eligible.filter((id) => id !== previous)
  const pool = alternatives.length > 0 ? alternatives : eligible
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
  events?: ItemEvent[]
  daySnapshots?: DaySnapshot[]
  soulPassiveActivations?: SoulPassiveActivation[]
  random?: Random
}

export interface BossSyncResult {
  encounters: BossEncounter[]
  /** Registros que hay que persistir; vacío si nada cambia. */
  changed: BossEncounter[]
  /** Mismo objeto que el de entrada si el perfil no cambia. */
  profile: PlayerProfile
  leveledUp: boolean
  passiveActivationSources: string[]
  passiveActivations: SoulPassiveActivation[]
  dailyPassiveActivations: SoulPassiveActivation[]
}

interface Verdict {
  won: boolean
  lost?: boolean
  resolvedOn?: string
}

const DRACULA_LEVELS = [10, 20, 30] as const

function updateDraculaMilestones(profile: PlayerProfile, today: string): PlayerProfile {
  const completed = profile.draculaMilestones ?? []
  const eligible = [
    ...DRACULA_LEVELS
      .filter((level) => profile.level >= level)
      .map((level) => `level:${level}`),
    ...ROUTE_IDS
      .filter((routeId) => (profile.routes[routeId]?.level ?? 0) >= MAX_ROUTE_LEVEL)
      .map((routeId) => `route:${routeId}`),
  ]
  const newMilestones = eligible.filter((milestone) => !completed.includes(milestone))
  const revengeDue = Boolean(profile.draculaRevengeOn && profile.draculaRevengeOn <= today)
  if (newMilestones.length === 0 && !revengeDue) return profile
  return {
    ...profile,
    draculaMilestones: newMilestones.length > 0
      ? [...completed, ...newMilestones]
      : completed,
    draculaPending: Boolean(profile.draculaPending) || newMilestones.length > 0 || revengeDue,
    ...(newMilestones.length > 0 || revengeDue ? { draculaRevengeOn: undefined } : {}),
  }
}

function allDraculaMilestonesCompleted(profile: PlayerProfile): boolean {
  const completed = new Set(profile.draculaMilestones ?? [])
  return [
    ...DRACULA_LEVELS.map((level) => `level:${level}`),
    ...ROUTE_IDS.map((routeId) => `route:${routeId}`),
  ].every((milestone) => completed.has(milestone))
}

function sameDraculaState(left: BossEncounter, right: DraculaProgress): boolean {
  const leftPhases = left.draculaPhasesCompleted ?? []
  return left.draculaPhase === right.phase
    && left.draculaPhaseStartedOn === right.phaseStartedOn
    && left.draculaPhaseEndsOn === right.phaseEndsOn
    && left.goal === right.goal
    && leftPhases.length === right.completedPhases.length
    && leftPhases.every((phase, index) => phase === right.completedPhases[index])
}

function verdictOf(
  encounter: BossEncounter,
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  events: ItemEvent[],
  today: string,
  runStartedAt?: string,
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
  if (boss.objective.kind === 'scythes') {
    const progress = scytheProgress(encounter, items, completionsByItem, today)
    if (progress.scythes >= boss.objective.target) {
      return { won: false, lost: true, resolvedOn: progress.reachedOn }
    }
    return {
      won: today > (encounter.windowEnd ?? today),
      resolvedOn: today > (encounter.windowEnd ?? today) ? encounter.windowEnd : undefined,
    }
  }
  if (boss.objective.kind === 'statues') {
    const progress = statueProgress(encounter, items, completionsByItem, today)
    return { won: Boolean(progress.reachedOn), resolvedOn: progress.reachedOn }
  }
  if (boss.objective.kind === 'heads') {
    const progress = cerberusProgress(encounter, items, completionsByItem, today)
    return { won: Boolean(progress.reachedOn), resolvedOn: progress.reachedOn }
  }
  if (boss.objective.kind === 'growingHeads') {
    const progress = hydraProgress(encounter, items, completionsByItem, events, today, runStartedAt)
    return { won: Boolean(progress.reachedOn), resolvedOn: progress.reachedOn }
  }
  if (boss.objective.kind === 'postponedTasks') {
    const progress = sukamonProgress(encounter, items, completionsByItem)
    return { won: progress.won, resolvedOn: progress.resolvedOn }
  }
  if (boss.objective.kind === 'duel') {
    const progress = doppelgangerProgress(encounter, items, completionsByItem, events, today, runStartedAt)
    return { won: progress.won, resolvedOn: progress.resolvedOn }
  }
  if (boss.objective.kind === 'dracula') return { won: false }
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
  const events = input.events ?? []
  const random = input.random ?? Math.random
  const changed = new Map<string, BossEncounter>()
  const records = new Map<string, BossEncounter>()
  const passiveActivationSources = new Set<string>()
  const dailyPassiveActivations: SoulPassiveActivation[] = []
  for (const encounter of input.encounters) {
    const migrated = migrateEncounter(encounter)
    records.set(migrated.id, migrated)
    if (migrated !== encounter) changed.set(migrated.id, migrated)
  }
  let profile = input.profile
  const passiveActivations: SoulPassiveActivation[] = []
  const applyDamage = (damage: number, date: string, sourceId: string) => {
    passiveActivationSources.add(sourceId)
    const snapshot = input.daySnapshots?.find((candidate) =>
      candidate.date === date && candidate.runStartedAt === profile.runStartedAt,
    )
    const rank = profile.runStartedAt
      ? soulPassiveRankOn(profile, 'death', date, snapshot) || undefined
      : undefined
    const savesUsed = [
      ...(input.soulPassiveActivations ?? []),
      ...passiveActivations,
    ].filter((activation) =>
      activation.runStartedAt === profile.runStartedAt
      && activation.passiveId === 'secondChance'
      && activation.date <= date,
    ).length
    const incomingDamage = Math.ceil(damage * eclipseMultiplierForDay(date))
    const resolution = resolvePlayerDamage(
      profile.hp,
      incomingDamage,
      rank,
      savesUsed,
    )
    profile = applyBossDamage(profile, damage, date, rank ?? 0, savesUsed)
    if (resolution.deathSaved && profile.runStartedAt && rank) {
      const activation = createSoulPassiveActivation({
        profile,
        soulId: 'death',
        date,
        runStartedAt: profile.runStartedAt,
        sourceId,
        snapshot,
        rankOverride: rank,
      })
      if (activation) passiveActivations.push(activation)
    }
  }
  const historicalLegionVictories = legionVictoriesInRun([...records.values()], profile.runStartedAt)
  const inferredLegionVictories = Math.max(
    profile.legionVictories ?? 0,
    historicalLegionVictories,
    profile.relics?.includes('heart') && profile.legionVictories === undefined ? 1 : 0,
  )
  if (profile.legionVictories !== inferredLegionVictories) {
    profile = { ...profile, legionVictories: inferredLegionVictories }
  }
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
    passiveActivationSources: [...passiveActivationSources],
    passiveActivations,
    dailyPassiveActivations,
  })
  if (profile.dead) return {
    encounters: input.encounters,
    changed: [],
    profile,
    leveledUp: false,
    passiveActivationSources: [],
    passiveActivations: [],
    dailyPassiveActivations: [],
  }

  profile = updateDraculaMilestones(profile, today)
  const tick = tickCurses(profile.curses, profile.hp, today, eclipseMultiplierForDay)
  if (tick.changed) profile = { ...profile, curses: tick.curses, hp: tick.hp }
  if (profile.runStartedAt) {
    const healedDate = shiftKey(today, -1)
    const sourceId = `hydra-dawn:${healedDate}`
    const snapshot = input.daySnapshots?.find((candidate) =>
      candidate.date === healedDate && candidate.runStartedAt === profile.runStartedAt,
    )
    const rank = soulPassiveRankOn(profile, 'hydra-scylla', healedDate, snapshot)
    const alreadyGranted = (input.soulPassiveActivations ?? []).some((activation) =>
      activation.runStartedAt === profile.runStartedAt
      && activation.passiveId === 'hydraDawnHeal'
      && activation.sourceId === sourceId,
    )
    const itemsById = new Map(items.map((item) => [item.id, item]))
    const hadMiss = events.some((event) =>
      event.kind === 'missed'
      && eventDate(event, itemsById) === healedDate
      && eventBelongsToRun(event, profile.runStartedAt),
    )
    if (rank && !alreadyGranted && !hadMiss) {
      const activation = createSoulPassiveActivation({
        profile,
        soulId: 'hydra-scylla',
        date: healedDate,
        runStartedAt: profile.runStartedAt,
        sourceId,
        snapshot,
      })
      if (activation) {
        profile = {
          ...profile,
          hp: Math.min(effectiveMaxHp(profile, today), profile.hp + hydraDawnHeal(rank)),
        }
        dailyPassiveActivations.push(activation)
      }
    }
  }

  let current = latestEncounter([...records.values()])
  // Sin encuentros, o con el último ya resuelto y sin sucesor (p. ej. tras renacer), se programa otro.
  if (!current || isResolved(current)) {
    const first = profile.draculaPending ? 'dracula' : pickBoss(current?.bossId, random)
    current = newEncounter(
      first,
      (current?.sequence ?? 0) + 1,
      'scheduled',
      profile.draculaPending ? today : shiftKey(today, rollDelay(BOSSES[first], random)),
    )
    save(current)
  }

  // Una resolución crea la siguiente aparición; el tope evita bucles tras una ausencia muy larga.
  for (let step = 0; step < 4 && current; step += 1) {
    if (isPending(current)) {
      if (today < current.scheduledFor && !profile.draculaPending) break
      const context = { today, profile, items, completionsByItem, encounters: [...records.values()], events }
      const chosen = profile.draculaPending || current.bossId === 'dracula'
        ? 'dracula'
        : reactiveBoss(context)
          ?? (current.bossId === 'sukamon' ? pickBoss(current.bossId, random) : current.bossId)
      const boss = BOSSES[chosen]
      const goal = boss.objective.kind === 'lifeSteal'
        ? initialLifeStolen(profile)
        : boss.objective.kind === 'scythes' ? boss.objective.target
        : bossGoal(boss, items, today)
      const headGoals = boss.objective.kind === 'heads' ? cerberusHeadGoals(items, today) : undefined
      const targetItemIds = boss.objective.kind === 'postponedTasks'
        ? sukamonTargetItemIds(context)
        : undefined
      if (boss.objective.kind === 'lifeSteal' && goal > 0) {
        applyDamage(goal, today, `boss:${current.id}:lifeSteal`)
      }
      current = {
        ...current,
        bossId: chosen,
        status: 'active',
        windowStart: today,
        windowEnd: shiftKey(today, boss.windowDays - 1),
        goal,
        ...(headGoals ? { headGoals } : {}),
        ...(targetItemIds ? { targetItemIds } : {}),
        zones: bossZones(boss, items),
        ...(boss.objective.kind === 'dracula' ? {
          goal: 2,
          draculaPhase: 'human' as const,
          draculaPhaseStartedOn: today,
          draculaPhaseEndsOn: shiftKey(today, 3),
          draculaBatGoal: goal,
          draculaPhasesCompleted: [],
        } : {}),
      }
      if (chosen === 'dracula') {
        profile = { ...profile, draculaPending: false, draculaRevengeOn: undefined }
      }
      save(current)
    }
    if (current.status !== 'active') break

    const boss = BOSSES[current.bossId]
    let verdict: Verdict | undefined
    if (boss.objective.kind === 'dracula') {
      const progress = draculaProgress(
        current,
        items,
        completionsByItem,
        events,
        today,
        profile.runStartedAt,
      )
      if (!sameDraculaState(current, progress)) {
        current = {
          ...current,
          draculaPhase: progress.phase,
          draculaPhaseStartedOn: progress.phaseStartedOn,
          draculaPhaseEndsOn: progress.phaseEndsOn,
          draculaPhasesCompleted: progress.completedPhases,
          goal: progress.goal,
        }
        save(current)
      }
      verdict = progress.verdict
    } else {
      verdict = verdictOf(current, items, completionsByItem, events, today, profile.runStartedAt)
    }
    if (!verdict) break
    let resolved: BossEncounter | null = null
    if (verdict.won) {
      const baseRewards = rollRewards(boss, profile.level, random)
      const digivice = boss.id === 'sukamon' && !profile.digivice && random() < 0.03
      const soulResult = boss.id === 'sukamon'
        ? { profile, award: undefined }
        : collectSoul(profile, boss.id, boss.soulChance, random)
      profile = applyBossRevenge(soulResult.profile, boss)
      if (boss.id === 'legion') {
        profile = { ...profile, legionVictories: (profile.legionVictories ?? 0) + 1 }
      }
      const cosmetics = boss.firstVictoryCosmetic
        && !profile.unlockedCosmetics?.includes(boss.firstVictoryCosmetic)
        ? [boss.firstVictoryCosmetic]
        : []
      if (cosmetics.length > 0) {
        profile = {
          ...profile,
          unlockedCosmetics: [...(profile.unlockedCosmetics ?? []), ...cosmetics],
        }
      }
      const relics = boss.firstVictoryRelic
        && !profile.relics?.includes(boss.firstVictoryRelic)
        && !firstVictoryInRun([...records.values()], boss.id, profile.runStartedAt)
        ? [boss.firstVictoryRelic]
        : []
      if (relics.length > 0) profile = { ...profile, relics: [...(profile.relics ?? []), ...relics] }
      const rolledRewards = boss.objective.kind === 'scythes'
        ? {
          ...baseRewards,
          coins: baseRewards.coins + (current.stakeCoins ?? 0)
            * (scytheProgress(current, items, completionsByItem, today).scythes === 0 ? 3 : 2),
        }
        : baseRewards
      const rewards = eclipseAdjustedRewards(rolledRewards, verdict.resolvedOn ?? today)
      const awardedRewards = {
        ...rewards,
        ...(digivice ? { digivice: true } : {}),
        ...(cosmetics.length > 0 ? { cosmetics } : {}),
        ...(soulResult.award ? { souls: { [boss.id]: soulResult.award } } : {}),
        ...(relics.length > 0 ? { relics } : {}),
      }
      const applied = applyBossReward(profile, awardedRewards)
      profile = digivice ? { ...applied.profile, digivice: true } : applied.profile
      if (boss.id === 'dracula') {
        profile = { ...profile, draculaRevengeOn: undefined }
      }
      leveledUp = leveledUp || applied.leveledUp
      resolved = {
        ...current,
        status: 'victory',
        ...(boss.id === 'dracula' ? { windowEnd: verdict.resolvedOn ?? today } : {}),
        resolvedOn: verdict.resolvedOn,
        rewardGranted: true,
        rewards: awardedRewards,
      }
    } else if (verdict.lost || today > (current.windowEnd as string)) {
      const damageDate = verdict.resolvedOn ?? shiftKey(current.windowEnd as string, 1)
      applyDamage(boss.defeatDamage, damageDate, `boss:${current.id}:defeat`)
      if (boss.id === 'sukamon') {
        profile = { ...profile, postponeTokens: Math.max(0, profile.postponeTokens - 1) }
      }
      if (boss.defeatCurse && !profile.dead) {
        const curses = addCurse(
          profile.curses,
          boss.defeatCurse.id,
          boss.id,
          today,
          boss.defeatCurse.days ?? 0,
          boss.defeatCurse.permanent,
          profile.relics,
        )
        const cursed = { ...profile, curses }
        profile = { ...cursed, hp: Math.min(cursed.hp, effectiveMaxHp(cursed, today)) }
      }
      resolved = {
        ...current,
        status: 'defeat',
        ...(boss.id === 'dracula' && current.draculaPhaseEndsOn
          ? { windowEnd: current.draculaPhaseEndsOn }
          : {}),
        resolvedOn: verdict.resolvedOn ?? shiftKey(current.windowEnd as string, 1),
        damageApplied: true,
        curse: boss.defeatCurse?.id,
      }
      if (boss.id === 'dracula') {
        const revengeOn = !profile.draculaPending && allDraculaMilestonesCompleted(profile)
          ? shiftKey(resolved.resolvedOn ?? today, rollDelay(boss, random))
          : undefined
        profile = { ...profile, draculaRevengeOn: revengeOn }
      }
    }
    if (!resolved) break

    const pendingDracula = Boolean(profile.draculaPending)
    const scheduledRevenge = boss.id === 'dracula'
      && resolved.status === 'defeat'
      && profile.draculaRevengeOn
    const next = pendingDracula || scheduledRevenge
      ? 'dracula'
      : pickBoss(boss.id, random)
    const nextActivationOn = pendingDracula
      ? today
      : scheduledRevenge
        ? profile.draculaRevengeOn as string
        : shiftKey(resolved.resolvedOn as string, rollDelay(boss, random))
    save({ ...resolved, nextActivationOn })
    current = newEncounter(next, resolved.sequence + 1, 'cooldown', nextActivationOn)
    save(current)
    if (profile.dead) break
  }

  return finish()
}
