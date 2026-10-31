import { addDays, format, parseISO } from 'date-fns'
import { v4 as uuid } from 'uuid'
import { db } from '../db/database'
import type { BossEncounter, Completion, DaySnapshot, Item, ItemEvent, PenaltyCheckpoint, PlayerProfile } from '../types'
import { activeEncounter, effectPercentForItemOn, isMedusaStatueOn, protectionsDisabledOn } from './bosses'
import { activeCursesOn, CURSES, removeCurse } from './curses'
import { curseDamageMultiplier, freezesEnabled, modifyCoins, modifyXp } from './modifiers'
import { activityDateKey, logicalNow, todayKey } from './date'
import {
  addXp,
  DIFFICULTY_COINS,
  DIFFICULTY_XP,
  HP_PER_LEVEL,
  levelUpRecovery,
  rewindXp,
  xpToNextLevel,
} from './gamification'
import { buildItemEvent, itemEventId } from './itemEvents'
import { computeMissedPenalties } from './penalties'
import {
  completionInWindow,
  isObligation,
  isItemDueOn,
  isWindowClosingOn,
  isWindowCompleted,
  missedCarryOf,
  scheduledDateFor,
  windowDaysOf,
} from './recurrence'
import { effectiveMaxHp, hasShield, recomputeRoute, ROUTE_IDS, xpWithBonus } from './routes'
import { isFirstZoneCompletionOn } from './souls'
import {
  dailySoulBonusTotals,
  reconcileDailySoulRewards,
  type DailySoulBonusCompletion,
  type DailySoulRewardResult,
} from './dailySoulRewards'
import { reconcileSoulPassiveActivations } from './soulPassiveLedger'
import { eclipseMultiplierForDay } from './weather'

export interface DayCorrection {
  itemId: string
  date: string
  /** 0/1 en tareas booleanas; cantidad total de la aparición en tareas cuantitativas. */
  quantity: number
}

export class CorrectionDeathError extends Error {
  readonly damage: number

  constructor(damage: number) {
    super(`Esta corrección causa ${damage} de daño adicional y termina la expedición. La muerte no se puede deshacer.`)
    this.damage = damage
  }
}

export function yesterdayKey(): string {
  return format(addDays(logicalNow(), -1), 'yyyy-MM-dd')
}

export function isCorrectionDay(date: string): boolean {
  return date === todayKey() || date === yesterdayKey()
}

export function correctionItemsForDate(items: Item[], profile: PlayerProfile, date: string): Item[] {
  const checkpoint = profile.penaltyCheckpoint
  if (checkpoint?.date !== date) return items
  const historical = new Map(checkpoint.items.map((item) => [item.id, item]))
  return items.map((item) => {
    const previous = historical.get(item.id)
    return previous ? { ...previous, archived: previous.archived || item.archived } : item
  })
}

export function correctionCandidates(
  items: Item[],
  history: Record<string, Completion[]>,
  date: string,
): Item[] {
  return items.filter((item) => {
    if (item.archived || activityDateKey(item.createdAt) > date || (item.startDate && item.startDate > date)) return false
    const completions = history[item.id] ?? []
    return completions.some((completion) => completion.date === date)
      || isItemDueOn(item, parseISO(date))
      || (item.type === 'todo' && Boolean(item.dueDate && item.dueDate <= date))
      || missedCarryOf(item, completions, date) !== null
  })
}

export interface CorrectionCandidateGroups {
  failed: Item[]
  registered: Item[]
  pending: Item[]
  sideQuests: Item[]
  failureEvents: Record<string, ItemEvent[]>
}

export function groupCorrectionCandidates(
  candidates: Item[],
  history: Record<string, Completion[]>,
  date: string,
  events: ItemEvent[],
  itemsForDate: Item[],
  runStartedAt?: string,
): CorrectionCandidateGroups {
  const failureEvents: Record<string, ItemEvent[]> = {}
  for (const event of events) {
    if (event.kind !== 'missed' || (!(event.damage ?? 0) && !event.protectedBy)
      || !belongsToRun(event, runStartedAt) || penaltyDate(event, itemsForDate) !== date) continue
    const itemEvents = failureEvents[event.itemId] ?? []
    itemEvents.push(event)
    failureEvents[event.itemId] = itemEvents
  }

  const groups: CorrectionCandidateGroups = {
    failed: [],
    registered: [],
    pending: [],
    sideQuests: [],
    failureEvents,
  }
  for (const item of candidates) {
    if (item.commitment === 'sideQuest') {
      groups.sideQuests.push(item)
    } else if (failureEvents[item.id]) {
      groups.failed.push(item)
    } else if (completionInWindow(item, history[item.id] ?? [], date)?.date === date) {
      groups.registered.push(item)
    } else {
      groups.pending.push(item)
    }
  }
  const byTitle = (left: Item, right: Item) => left.title.localeCompare(right.title, 'es', { sensitivity: 'base' })
  const damageFor = (item: Item) =>
    failureEvents[item.id]?.reduce((total, event) => total + (event.damage ?? 0), 0) ?? 0
  groups.failed.sort((left, right) => damageFor(right) - damageFor(left) || byTitle(left, right))
  groups.registered.sort(byTitle)
  groups.pending.sort(byTitle)
  groups.sideQuests.sort(byTitle)
  return groups
}

function historyByItem(completions: Completion[]): Record<string, Completion[]> {
  const history: Record<string, Completion[]> = {}
  for (const completion of completions) (history[completion.itemId] ??= []).push(completion)
  return history
}

/** Fecha en que cuenta la penalización de un fallo: el cierre de la ventana de la aparición. */
export function penaltyDate(event: ItemEvent, items: Item[]): string {
  if (event.activityDate) return event.activityDate
  const item = items.find((candidate) => candidate.id === event.itemId)
  return format(addDays(parseISO(event.scheduledDate), item ? windowDaysOf(item) - 1 : 0), 'yyyy-MM-dd')
}

export function belongsToRun(event: ItemEvent, runStartedAt?: string): boolean {
  if (!runStartedAt) return true
  return event.runStartedAt
    ? event.runStartedAt === runStartedAt
    : new Date(event.occurredAt) >= new Date(runStartedAt)
}

function yesterdayMisses(events: ItemEvent[], checkpoint: PenaltyCheckpoint, runStartedAt = checkpoint.runStartedAt): ItemEvent[] {
  const ids = new Set(checkpoint.items.map((item) => item.id))
  return events.filter((event) => ids.has(event.itemId) && belongsToRun(event, runStartedAt)
    && event.kind === 'missed' && penaltyDate(event, checkpoint.items) === checkpoint.date)
}

function replayPenalties(
  checkpoint: PenaltyCheckpoint,
  history: Record<string, Completion[]>,
  damageMultiplierForDay: (dateKey: string, item: Item) => number = () => 1,
  freezesEnabledForDay: (dateKey: string) => boolean = () => true,
  shieldEnabledForDay: (dateKey: string) => boolean = () => true,
) {
  const result = computeMissedPenalties(
    checkpoint.items,
    history,
    format(addDays(parseISO(checkpoint.date), -1), 'yyyy-MM-dd'),
    checkpoint.freezes,
    { enabled: checkpoint.shieldEnabled, readyOn: checkpoint.shieldReadyOn },
    checkpoint.date,
    damageMultiplierForDay,
    freezesEnabledForDay(checkpoint.date),
    shieldEnabledForDay,
  )
  result.missedEvents = result.missedEvents.map((event) => ({
    ...event,
    id: checkpoint.runStartedAt ? `${event.id}:${checkpoint.runStartedAt}` : event.id,
    runStartedAt: checkpoint.runStartedAt,
  }))
  return result
}

export function snapshotOf(profile: PlayerProfile, date: string): DaySnapshot {
  return {
    date, runStartedAt: profile.runStartedAt, level: profile.level, xp: profile.xp,
    hp: profile.hp, maxHp: effectiveMaxHp(profile, date),
    soulLoadout: profile.dailySoulLoadout?.date === date
      ? [...profile.dailySoulLoadout.souls]
      : undefined,
  }
}

/**
 * Perfiles que ya habían liquidado ayer antes de existir los snapshots: se reconstruye el cierre
 * retirando la EXP ganada después. La vida es la actual, la única disponible.
 */
function legacySnapshot(profile: PlayerProfile, history: Record<string, Completion[]>, date: string): DaySnapshot {
  let laterXp = 0
  for (const completions of Object.values(history)) {
    for (const completion of completions) {
      if (completion.date > date && (!profile.runStartedAt || new Date(completion.createdAt) >= new Date(profile.runStartedAt))) {
        laterXp += completion.xpEarned
      }
    }
  }
  const { level, xp } = rewindXp(profile.level, profile.xp, laterXp)
  return { ...snapshotOf(profile, date), level, xp }
}

async function ensureSnapshot(profile: PlayerProfile, history: Record<string, Completion[]>, date: string) {
  const existing = await db.daySnapshots.get(date)
  if (existing?.runStartedAt === profile.runStartedAt) return
  await db.daySnapshots.put(legacySnapshot(profile, history, date))
}

function allObligationsCompletedOn(
  items: Item[],
  history: Record<string, Completion[]>,
  date: string,
): boolean {
  const obligations = items.filter((item) => !item.archived && isObligation(item) && isWindowClosingOn(item, parseISO(date)))
  return obligations.length > 0
    && obligations.every((item) => isWindowCompleted(item, history[item.id] ?? [], date))
}

export function applyPenance(
  profile: PlayerProfile,
  items: Item[],
  history: Record<string, Completion[]>,
  date: string,
): PlayerProfile {
  const progress = { ...(profile.penanceProgress ?? {}) }
  let curses = profile.curses
  const completed = allObligationsCompletedOn(items, history, date)
  for (const curse of activeCursesOn(profile.curses, date).filter((entry) => CURSES[entry.id].severity === 'grave')) {
    const next = completed ? Math.min(3, (progress[curse.id] ?? 0) + 1) : 0
    progress[curse.id] = next
    if (next >= 3) {
      curses = removeCurse(curses, curse.id)
      progress[curse.id] = 0
    }
  }
  return { ...profile, curses, penanceProgress: progress }
}

/** Guarda las entradas de la evaluación de ayer, no solo el daño, para poder repetirla. */
export async function settleDayPenalties(): Promise<void> {
  await db.transaction('rw', [db.profile, db.items, db.completions, db.itemEvents, db.daySnapshots, db.bossEncounters], async () => {
    let profile = await db.profile.get(1)
    if (!profile || profile.dead) return
    const items = await db.items.toArray()
    const history = historyByItem(await db.completions.toArray())
    const encounters = await db.bossEncounters.toArray()
    const currentCurses = profile.curses
    const protectionsEnabledForDay = (dateKey: string) => !encounters.some((encounter) =>
      protectionsDisabledOn(encounter, dateKey))
    const freezesEnabledForDay = (dateKey: string) => freezesEnabled({ curses: currentCurses }, dateKey)
      && protectionsEnabledForDay(dateKey)
    const shieldEnabledForDay = (dateKey: string) => protectionsEnabledForDay(dateKey)
    const damageMultiplierForDay = (dateKey: string, item: Item) => {
      const encounter = encounters.find((candidate) => effectPercentForItemOn(candidate, 'damagePercent', dateKey, item.zone) !== 100)
      const bossMultiplier = effectPercentForItemOn(encounter, 'damagePercent', dateKey, item.zone) / 100
      const statueMultiplier = encounters.some((candidate) =>
        candidate.bossId === 'medusa'
        && isMedusaStatueOn(candidate, item, dateKey, items)
        && !isWindowCompleted(item, history[item.id] ?? [], dateKey)) ? 2 : 1
      return bossMultiplier * statueMultiplier
        * curseDamageMultiplier({ curses: currentCurses }, dateKey)
        * eclipseMultiplierForDay(dateKey)
    }
    const yesterday = yesterdayKey()
    if (profile.lastPenaltyCheck && profile.lastPenaltyCheck >= yesterday) {
      if (profile.penaltyCheckpoint?.date === yesterday) {
        await ensureSnapshot(profile, history, yesterday)
        return
      }
      if (profile.runStartedAt && activityDateKey(profile.runStartedAt) >= yesterday) {
        await db.profile.put({
          ...profile,
          penaltyCheckpoint: { date: yesterday, items: [], freezes: 0, shieldEnabled: false, runStartedAt: profile.runStartedAt },
        })
        return
      }
      // Compatibilidad con la evaluación realizada por una versión anterior de la app.
      const events = await db.itemEvents.toArray()
      const misses = yesterdayMisses(events, { date: yesterday, items, freezes: 0, shieldEnabled: false }, profile.runStartedAt)
      const shieldUsed = misses.some((event) => event.protectedBy === 'shield')
      await db.profile.put({
        ...profile,
        penaltyCheckpoint: {
          date: yesterday,
          items,
          freezes: profile.streakFreezes + misses.filter((event) => event.protectedBy === 'freeze').length,
          shieldEnabled: shieldUsed || hasShield(profile),
          shieldReadyOn: shieldUsed ? undefined : profile.shieldReadyOn,
          runStartedAt: profile.runStartedAt,
        },
      })
      await ensureSnapshot(profile, history, yesterday)
      return
    }

    const dayBefore = format(addDays(parseISO(yesterday), -1), 'yyyy-MM-dd')
    if (profile.lastPenaltyCheck && profile.lastPenaltyCheck < dayBefore) {
      const earlier = computeMissedPenalties(
        items, history, profile.lastPenaltyCheck, profile.streakFreezes,
        { enabled: hasShield(profile), readyOn: profile.shieldReadyOn }, dayBefore, damageMultiplierForDay,
        freezesEnabledForDay(dayBefore),
        shieldEnabledForDay,
      )
      await db.itemEvents.bulkPut(earlier.missedEvents)
      const hp = Math.max(0, profile.hp - earlier.totalDamage)
      profile = {
        ...profile, hp, dead: hp === 0, lastPenaltyCheck: dayBefore,
        streakFreezes: profile.streakFreezes - earlier.freezesUsed,
        shieldReadyOn: earlier.shieldReadyOn,
      }
    }

    if (!profile.dead) {
      const checkpoint: PenaltyCheckpoint = {
        date: yesterday, items, freezes: profile.streakFreezes,
        shieldEnabled: hasShield(profile), shieldReadyOn: profile.shieldReadyOn,
        runStartedAt: profile.runStartedAt,
      }
      const result = replayPenalties(checkpoint, history, damageMultiplierForDay, freezesEnabledForDay, shieldEnabledForDay)
      await db.itemEvents.bulkPut(result.missedEvents)
      const hp = Math.max(0, profile.hp - result.totalDamage)
      profile = {
        ...profile, hp, dead: hp === 0, lastPenaltyCheck: yesterday,
        streakFreezes: profile.streakFreezes - result.freezesUsed,
        shieldReadyOn: result.shieldReadyOn, penaltyCheckpoint: checkpoint,
      }
      profile = applyPenance(profile, items, history, yesterday)
    }
    if (!profile.dead) await db.daySnapshots.put(snapshotOf(profile, yesterday))
    await db.profile.put(profile)
  })
}

export async function confirmLegacyExpedition(): Promise<void> {
  await db.transaction('rw', db.profile, async () => {
    const profile = await db.profile.get(1)
    if (!profile || profile.dead) throw new Error('No se puede editar una expedición terminada.')
    if (profile.runStartedAt) return
    const runStartedAt = `${yesterdayKey()}T02:00:00`
    await db.profile.put({
      ...profile, runStartedAt,
      penaltyCheckpoint: profile.penaltyCheckpoint ? { ...profile.penaltyCheckpoint, runStartedAt } : undefined,
    })
  })
}

export interface CorrectionPlan {
  profile: PlayerProfile
  completions: Completion[]
  events: ItemEvent[]
  leveledUp: boolean
  itemUpdate?: Item
  /** Cierre del día corregido, ajustado igual que el perfil; ausente si no había snapshot que ajustar. */
  snapshot?: DaySnapshot
}

/** Aplica al snapshot de un día el mismo ajuste de EXP, nivel y vida que la corrección hizo al perfil. */
export function reconcileSnapshot(snapshot: DaySnapshot, xpDelta: number, damageDelta: number): DaySnapshot {
  const next = xpDelta >= 0
    ? addXp(snapshot.level, snapshot.xp, xpDelta)
    : { level: snapshot.level, xp: Math.max(0, snapshot.xp + xpDelta) }
  const levelsGained = next.level - snapshot.level
  const maxHp = snapshot.maxHp + levelsGained * HP_PER_LEVEL
  const health = levelsGained > 0
    ? Math.min(maxHp, snapshot.hp + levelUpRecovery(maxHp))
    : snapshot.hp
  return { ...snapshot, ...next, maxHp, hp: Math.max(0, Math.min(maxHp, health - damageDelta)) }
}

function reconcileSnapshotDailyBonus(snapshot: DaySnapshot, xpDelta: number): DaySnapshot {
  if (xpDelta >= 0) return reconcileSnapshot(snapshot, xpDelta, 0)
  const next = rewindXp(snapshot.level, snapshot.xp, -xpDelta)
  const levelsLost = snapshot.level - next.level
  const maxHp = Math.max(1, snapshot.maxHp - levelsLost * HP_PER_LEVEL)
  return { ...snapshot, ...next, maxHp, hp: Math.min(snapshot.hp, maxHp) }
}

/** Applies a day's recalculated soul rewards to its correction plan without retaining stale awards. */
export function reconcileDailySoulCorrection(
  plan: CorrectionPlan,
  profile: PlayerProfile,
  rewards: DailySoulRewardResult,
  date: string,
  previousCompletions: Completion[],
): CorrectionPlan {
  const previousBonus = dailySoulBonusTotals(previousCompletions, date)
  const xpDelta = rewards.xpBonus - previousBonus.xp
  const coinsDelta = rewards.coinsBonus - previousBonus.coins
  let nextProfile = plan.profile
  if (xpDelta > 0) {
    const nextXp = addXp(nextProfile.level, nextProfile.xp, xpDelta)
    const levelsGained = nextXp.level - nextProfile.level
    if (levelsGained > 0) {
      const maxHp = nextProfile.maxHp + levelsGained * HP_PER_LEVEL
      nextProfile = {
        ...nextProfile,
        ...nextXp,
        maxHp,
        hp: Math.min(maxHp, nextProfile.hp + levelUpRecovery(maxHp)),
      }
    } else {
      nextProfile = { ...nextProfile, ...nextXp }
    }
  } else if (xpDelta < 0) {
    const rewound = rewindXp(nextProfile.level, nextProfile.xp, -xpDelta)
    const levelsLost = nextProfile.level - rewound.level
    const maxHp = Math.max(1, nextProfile.maxHp - levelsLost * HP_PER_LEVEL)
    nextProfile = {
      ...nextProfile,
      ...rewound,
      maxHp,
      hp: Math.min(nextProfile.hp, maxHp),
    }
  }
  nextProfile = { ...nextProfile, coins: nextProfile.coins + coinsDelta }
  if (nextProfile.coins < 0) {
    throw new Error(`No puedes retirar oro ya gastado. Necesitas ${-nextProfile.coins} de oro más para guardar esta corrección.`)
  }

  const updatedEvents = plan.events.map((event) => {
    if ((event.kind !== 'completed' && event.kind !== 'lateRecovery')
      || (event.activityDate ?? activityDateKey(event.occurredAt)) !== date) return event
    const completion = rewards.completions.find((entry) =>
      entry.itemId === event.itemId && entry.date === date,
    )
    return completion
      ? { ...event, xpEarned: completion.xpEarned, coinsEarned: completion.coinsEarned }
      : event
  })
  const nextSnapshot = plan.snapshot
    ? reconcileSnapshotDailyBonus(plan.snapshot, xpDelta)
    : undefined
  return {
    ...plan,
    profile: nextProfile,
    completions: rewards.completions,
    events: updatedEvents,
    snapshot: nextSnapshot,
    leveledUp: nextProfile.level > profile.level,
  }
}

/** Cálculo puro: toda validación ocurre antes de escribir ninguno de los cambios. */
export function planDayCorrection(
  input: DayCorrection,
  profile: PlayerProfile,
  items: Item[],
  completions: Completion[],
  events: ItemEvent[],
  confirmedDamage?: number,
  snapshot?: DaySnapshot,
  boss?: BossEncounter | null,
): CorrectionPlan {
  if (!isCorrectionDay(input.date)) throw new Error('Solo se pueden corregir hoy y ayer (el día cambia a las 02:00).')
  if (profile.dead) throw new Error('No se puede editar una expedición terminada.')
  if (!profile.runStartedAt) throw new Error('Confirma primero que los días editables pertenecen a esta expedición.')
  if (input.date < activityDateKey(profile.runStartedAt)) throw new Error('Ese día pertenece a una expedición anterior.')
  const history = historyByItem(completions)
  const item = correctionCandidates(correctionItemsForDate(items, profile, input.date), history, input.date)
    .find((candidate) => candidate.id === input.itemId)
  if (!item) throw new Error('La actividad no está disponible en este día.')
  const goal = item.trackingType === 'quantity' ? item.quantityGoal : 1
  if (!goal || !Number.isInteger(input.quantity) || input.quantity < 0 || input.quantity > goal) {
    throw new Error(`Introduce una cantidad entera entre 0 y ${goal ?? 0}.`)
  }
  const existing = completionInWindow(item, history[item.id] ?? [], input.date)
  if (existing && existing.date !== input.date) {
    throw new Error(`Esta aparición tiene un registro del ${existing.date}. Corrígelo desde ese día; no se pueden modificar registros anteriores a ayer.`)
  }
  if (existing && new Date(existing.createdAt) < new Date(profile.runStartedAt)) {
    throw new Error('El registro pertenece a una expedición anterior.')
  }
  const dueOnDate = isItemDueOn(item, parseISO(input.date))
  const carriedFrom = missedCarryOf(item, history[item.id] ?? [], input.date)
  const scheduledDate = scheduledDateFor(item, parseISO(!dueOnDate && carriedFrom ? carriedFrom : input.date))
  const laterInWindow = (history[item.id] ?? []).some((completion) =>
    completion.date > input.date
      && scheduledDateFor(item, parseISO(completion.date)) === scheduledDate,
  )
  if (laterInWindow) throw new Error('Esta aparición ya tiene un registro posterior. Desmárcalo primero desde su día para evitar duplicados.')

  const complete = input.quantity >= goal
  const previousQuantity = existing ? (item.trackingType === 'boolean' ? 1 : existing.quantityDone ?? 0) : 0
  if (previousQuantity === input.quantity) return { profile, completions, events, leveledUp: false }
  const correctionSoulLoadout = snapshot?.date === input.date
    ? snapshot.soulLoadout
    : profile.dailySoulLoadout?.date === input.date
      ? profile.dailySoulLoadout.souls
      : undefined
  const modifiers = {
    boss,
    curses: profile.curses,
    soulProfile: correctionSoulLoadout
      ? {
          souls: profile.souls,
          equippedSouls: correctionSoulLoadout,
          dailySoulLoadout: { date: input.date, souls: correctionSoulLoadout },
        }
      : undefined,
    soulDate: correctionSoulLoadout ? input.date : undefined,
    soulFirstZone: complete && isFirstZoneCompletionOn(item, items, history, input.date),
  }
  const existingBaseXp = existing
    ? existing.xpEarned - ((existing as DailySoulBonusCompletion).dailySoulBonusXp ?? 0)
    : 0
  const existingBaseCoins = existing
    ? existing.coinsEarned - ((existing as DailySoulBonusCompletion).dailySoulBonusCoins ?? 0)
    : 0
  const xp = complete
    ? (existingBaseXp || modifyXp(xpWithBonus(DIFFICULTY_XP[item.difficulty], profile), modifiers, input.date))
    : 0
  const coins = complete
    ? (existingBaseCoins || modifyCoins(DIFFICULTY_COINS[item.difficulty], modifiers, input.date))
    : 0
  const coinDelta = coins - existingBaseCoins
  if (profile.coins + coinDelta < 0) {
    throw new Error(`No puedes retirar oro ya gastado. Necesitas ${-(profile.coins + coinDelta)} de oro más para guardar esta corrección.`)
  }
  const nextCompletions = completions.filter((completion) => completion.id !== existing?.id)
  if (input.quantity > 0) {
    nextCompletions.push({
      id: existing?.id ?? uuid(), itemId: item.id, date: input.date,
      quantityDone: item.trackingType === 'quantity' ? input.quantity : undefined,
      quantityGoal: item.quantityGoal,
      xpEarned: xp, coinsEarned: coins, createdAt: existing?.createdAt ?? new Date().toISOString(),
    })
  }
  const nextHistory = historyByItem(nextCompletions)
  let nextEvents = events.filter((event) => {
    if (!belongsToRun(event, profile.runStartedAt)) return true
    if (event.itemId !== item.id || event.kind === 'missed' || event.kind === 'postponed') return true
    return event.scheduledDate !== scheduledDate
      && (event.activityDate ?? activityDateKey(event.occurredAt)) !== input.date
  })
  const late = item.type === 'todo' && Boolean(item.dueDate && item.dueDate < input.date)
    || !dueOnDate && carriedFrom !== null
  const kind = complete ? (late ? 'lateRecovery' : 'completed') : input.quantity > 0 ? 'partialProgress' : 'undone'
  nextEvents.push(buildItemEvent(item, kind, scheduledDate, {
    activityDate: input.date, xpEarned: xp, coinsEarned: coins,
    runStartedAt: profile.runStartedAt,
    quantityGoal: item.quantityGoal,
    quantityDone: item.trackingType === 'quantity' ? input.quantity : undefined,
  }, `${itemEventId(item.id, scheduledDate, kind)}:${profile.runStartedAt}`))

  let nextProfile = { ...profile, coins: profile.coins + coinDelta }
  let xpRemaining = Math.max(0, profile.xp + xp - existingBaseXp)
  let level = profile.level
  let maxHp = profile.maxHp
  while (xpRemaining >= xpToNextLevel(level)) {
    xpRemaining -= xpToNextLevel(level)
    level += 1
    maxHp += HP_PER_LEVEL
  }
  const leveledUp = level > profile.level
  nextProfile = { ...nextProfile, level, maxHp, xp: xpRemaining }
  const routes = { ...profile.routes }
  for (const id of ROUTE_IDS) {
    if (item.routeId !== id) continue
    routes[id] = recomputeRoute(id, routes[id], items, nextHistory, todayKey())
  }
  nextProfile = { ...nextProfile, routes }
  if (nextProfile.equippedRoute && routes[nextProfile.equippedRoute].level === 0) nextProfile.equippedRoute = null

  let damageDelta = 0
  const checkpoint = profile.penaltyCheckpoint
  if (checkpoint?.date === yesterdayKey()) {
    const oldMisses = yesterdayMisses(events, checkpoint, profile.runStartedAt)
    const protectionEnabledForDay = (dateKey: string) => !protectionsDisabledOn(boss, dateKey)
    const result = replayPenalties(
      checkpoint,
      nextHistory,
      boss?.bossId === 'medusa'
        ? (dateKey, candidate) => (isMedusaStatueOn(boss, candidate, dateKey, items) ? 2 : 1)
          * eclipseMultiplierForDay(dateKey)
        : (dateKey) => eclipseMultiplierForDay(dateKey),
      protectionEnabledForDay,
      protectionEnabledForDay,
    )
    damageDelta = result.totalDamage - oldMisses.reduce((sum, event) => sum + (event.damage ?? 0), 0)
    const restoredFreezes = oldMisses.filter((event) => event.protectedBy === 'freeze').length
    const freezes = profile.streakFreezes + restoredFreezes - result.freezesUsed
    if (freezes < 0) throw new Error('No quedan suficientes congelaciones para restaurar el estado anterior. Consigue una antes de deshacer esta corrección.')
    nextProfile.streakFreezes = freezes
    nextProfile.shieldReadyOn = result.shieldReadyOn
    const oldIds = new Set(oldMisses.map((event) => event.id))
    nextEvents = nextEvents.filter((event) => !oldIds.has(event.id))
    nextEvents.push(...result.missedEvents)
  } else if (input.date === yesterdayKey()) {
    throw new Error('No se ha podido recuperar la evaluación de ayer. Recarga la aplicación antes de corregirlo.')
  }

  const maxHealth = effectiveMaxHp(nextProfile)
  const health = leveledUp
    ? Math.min(maxHealth, profile.hp + levelUpRecovery(maxHealth))
    : profile.hp
  nextProfile.hp = Math.max(0, Math.min(maxHealth, health - damageDelta))
  nextProfile.dead = nextProfile.hp === 0
  if (nextProfile.dead && confirmedDamage !== Math.max(0, damageDelta)) {
    throw new CorrectionDeathError(Math.max(0, damageDelta))
  }
  const currentItem = items.find((candidate) => candidate.id === item.id)
  const itemUpdate = complete && currentItem?.postponedUntil && currentItem.postponedUntil <= input.date
    ? { ...currentItem, postponedFrom: undefined, postponedUntil: undefined }
    : undefined
  const nextSnapshot = snapshot?.date === input.date && snapshot.runStartedAt === profile.runStartedAt
    ? reconcileSnapshot(snapshot, xp - existingBaseXp, damageDelta)
    : undefined
  return {
    profile: nextProfile, completions: nextCompletions, events: nextEvents, leveledUp, itemUpdate,
    snapshot: nextSnapshot,
  }
}

export async function saveDayCorrection(input: DayCorrection, confirmedDamage?: number): Promise<CorrectionPlan> {
  await settleDayPenalties()
  return db.transaction('rw', [
    db.items, db.profile, db.completions, db.itemEvents, db.daySnapshots, db.bossEncounters,
    db.soulPassiveActivations,
  ], async () => {
    const profile = await db.profile.get(1)
    if (!profile) throw new Error('No se ha encontrado el perfil del jugador.')
    const items = await db.items.toArray()
    const completions = await db.completions.toArray()
    const events = await db.itemEvents.toArray()
    const snapshot = await db.daySnapshots.get(input.date)
    const boss = activeEncounter(await db.bossEncounters.toArray())
    const initialPlan = planDayCorrection(input, profile, items, completions, events, confirmedDamage, snapshot, boss)
    let plan = initialPlan
    if (initialPlan.completions !== completions) {
      const reconciledRewards = reconcileDailySoulRewards(
        profile,
        items,
        initialPlan.completions,
        input.date,
        snapshot,
      )
      plan = reconcileDailySoulCorrection(initialPlan, profile, reconciledRewards, input.date, completions)

      const sourceIds = [...new Set([
        ...completions.filter((completion) => completion.date === input.date).map((completion) => completion.id),
        ...plan.completions.filter((completion) => completion.date === input.date).map((completion) => completion.id),
      ])]
      const expected = reconciledRewards.activations.filter((activation) =>
        sourceIds.includes(activation.sourceId),
      )
      await reconcileSoulPassiveActivations(profile.runStartedAt!, sourceIds, expected)
    }
    const completionIds = new Set(plan.completions.map((completion) => completion.id))
    const eventIds = new Set(plan.events.map((event) => event.id))
    const originalCompletions = new Set(completions)
    const originalEvents = new Set(events)
    await db.completions.bulkDelete(completions.filter((completion) => !completionIds.has(completion.id)).map((completion) => completion.id))
    await db.itemEvents.bulkDelete(events.filter((event) => !eventIds.has(event.id)).map((event) => event.id))
    await db.completions.bulkPut(plan.completions.filter((completion) => !originalCompletions.has(completion)))
    await db.itemEvents.bulkPut(plan.events.filter((event) => !originalEvents.has(event)))
    if (plan.itemUpdate) await db.items.put(plan.itemUpdate)
    if (plan.snapshot) await db.daySnapshots.put(plan.snapshot)
    await db.profile.put(plan.profile)
    return plan
  })
}
