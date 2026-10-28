import { addDays, format, parseISO } from 'date-fns'
import { v4 as uuid } from 'uuid'
import { db } from '../db/database'
import type { Completion, Item, ItemEvent, PenaltyCheckpoint, PlayerProfile } from '../types'
import { activityDateKey, logicalNow, todayKey } from './date'
import { DIFFICULTY_COINS, DIFFICULTY_XP, xpToNextLevel } from './gamification'
import { buildItemEvent, itemEventId } from './itemEvents'
import { computeMissedPenalties } from './penalties'
import {
  completionInWindow,
  isItemDueOn,
  missedCarryOf,
  scheduledDateFor,
  windowDaysOf,
} from './recurrence'
import { effectiveMaxHp, evaluateRoute, hasShield, ROUTE_IDS, ROUTES, xpWithBonus } from './routes'

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

function historyByItem(completions: Completion[]): Record<string, Completion[]> {
  const history: Record<string, Completion[]> = {}
  for (const completion of completions) (history[completion.itemId] ??= []).push(completion)
  return history
}

function penaltyDate(event: ItemEvent, items: Item[]): string {
  if (event.activityDate) return event.activityDate
  const item = items.find((candidate) => candidate.id === event.itemId)
  return format(addDays(parseISO(event.scheduledDate), item ? windowDaysOf(item) - 1 : 0), 'yyyy-MM-dd')
}

function belongsToRun(event: ItemEvent, runStartedAt?: string): boolean {
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

function replayPenalties(checkpoint: PenaltyCheckpoint, history: Record<string, Completion[]>) {
  const result = computeMissedPenalties(
    checkpoint.items,
    history,
    format(addDays(parseISO(checkpoint.date), -1), 'yyyy-MM-dd'),
    checkpoint.freezes,
    { enabled: checkpoint.shieldEnabled, readyOn: checkpoint.shieldReadyOn },
    checkpoint.date,
  )
  result.missedEvents = result.missedEvents.map((event) => ({
    ...event,
    id: checkpoint.runStartedAt ? `${event.id}:${checkpoint.runStartedAt}` : event.id,
    runStartedAt: checkpoint.runStartedAt,
  }))
  return result
}

/** Guarda las entradas de la evaluación de ayer, no solo el daño, para poder repetirla. */
export async function settleDayPenalties(): Promise<void> {
  await db.transaction('rw', [db.profile, db.items, db.completions, db.itemEvents], async () => {
    let profile = await db.profile.get(1)
    if (!profile || profile.dead) return
    const items = await db.items.toArray()
    const history = historyByItem(await db.completions.toArray())
    const yesterday = yesterdayKey()
    if (profile.lastPenaltyCheck && profile.lastPenaltyCheck >= yesterday) {
      if (profile.penaltyCheckpoint?.date === yesterday) return
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
      return
    }

    const dayBefore = format(addDays(parseISO(yesterday), -1), 'yyyy-MM-dd')
    if (profile.lastPenaltyCheck && profile.lastPenaltyCheck < dayBefore) {
      const earlier = computeMissedPenalties(
        items, history, profile.lastPenaltyCheck, profile.streakFreezes,
        { enabled: hasShield(profile), readyOn: profile.shieldReadyOn }, dayBefore,
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
      const result = replayPenalties(checkpoint, history)
      await db.itemEvents.bulkPut(result.missedEvents)
      const hp = Math.max(0, profile.hp - result.totalDamage)
      profile = {
        ...profile, hp, dead: hp === 0, lastPenaltyCheck: yesterday,
        streakFreezes: profile.streakFreezes - result.freezesUsed,
        shieldReadyOn: result.shieldReadyOn, penaltyCheckpoint: checkpoint,
      }
    }
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
}

/** Cálculo puro: toda validación ocurre antes de escribir ninguno de los cambios. */
export function planDayCorrection(
  input: DayCorrection,
  profile: PlayerProfile,
  items: Item[],
  completions: Completion[],
  events: ItemEvent[],
  confirmedDamage?: number,
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
  const xp = complete ? (existing?.xpEarned || xpWithBonus(DIFFICULTY_XP[item.difficulty], profile)) : 0
  const coins = complete ? (existing?.coinsEarned || DIFFICULTY_COINS[item.difficulty]) : 0
  const coinDelta = coins - (existing?.coinsEarned ?? 0)
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
  let xpRemaining = Math.max(0, profile.xp + xp - (existing?.xpEarned ?? 0))
  let level = profile.level
  let maxHp = profile.maxHp
  while (xpRemaining >= xpToNextLevel(level)) {
    xpRemaining -= xpToNextLevel(level)
    level += 1
    maxHp += 5
  }
  const leveledUp = level > profile.level
  nextProfile = { ...nextProfile, level, maxHp, xp: xpRemaining }
  const routes = { ...profile.routes }
  for (const id of ROUTE_IDS) {
    if (item.routeId !== id) continue
    const progress = routes[id]
    if (!progress.windowStart) continue
    const activeLinked = items.filter((candidate) => candidate.routeId === id && !candidate.archived)
    const startedOn = progress.startedOn
      ?? activeLinked.map((candidate) => activityDateKey(candidate.createdAt)).sort()[0]
      ?? progress.windowStart
    const linked = items.filter((candidate) => candidate.routeId === id
      && activityDateKey(candidate.createdAt) >= startedOn
      && (!progress.startedAt || new Date(candidate.createdAt) >= new Date(progress.startedAt)))
    routes[id] = evaluateRoute(
      ROUTES[id], { ...progress, level: 0, windowStart: startedOn, startedOn }, linked, nextHistory, todayKey(),
    )
  }
  nextProfile = { ...nextProfile, routes }
  if (nextProfile.equippedRoute && routes[nextProfile.equippedRoute].level === 0) nextProfile.equippedRoute = null

  let damageDelta = 0
  const checkpoint = profile.penaltyCheckpoint
  if (checkpoint?.date === yesterdayKey()) {
    const oldMisses = yesterdayMisses(events, checkpoint, profile.runStartedAt)
    const result = replayPenalties(checkpoint, nextHistory)
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
  const health = leveledUp ? maxHealth : profile.hp
  nextProfile.hp = Math.max(0, Math.min(maxHealth, health - damageDelta))
  nextProfile.dead = nextProfile.hp === 0
  if (nextProfile.dead && confirmedDamage !== Math.max(0, damageDelta)) {
    throw new CorrectionDeathError(Math.max(0, damageDelta))
  }
  const currentItem = items.find((candidate) => candidate.id === item.id)
  const itemUpdate = complete && currentItem?.postponedUntil && currentItem.postponedUntil <= input.date
    ? { ...currentItem, postponedFrom: undefined, postponedUntil: undefined }
    : undefined
  return { profile: nextProfile, completions: nextCompletions, events: nextEvents, leveledUp, itemUpdate }
}

export async function saveDayCorrection(input: DayCorrection, confirmedDamage?: number): Promise<CorrectionPlan> {
  await settleDayPenalties()
  return db.transaction('rw', [db.items, db.profile, db.completions, db.itemEvents], async () => {
    const profile = await db.profile.get(1)
    if (!profile) throw new Error('No se ha encontrado el perfil del jugador.')
    const items = await db.items.toArray()
    const completions = await db.completions.toArray()
    const events = await db.itemEvents.toArray()
    const plan = planDayCorrection(input, profile, items, completions, events, confirmedDamage)
    const completionIds = new Set(plan.completions.map((completion) => completion.id))
    const eventIds = new Set(plan.events.map((event) => event.id))
    const originalCompletions = new Set(completions)
    const originalEvents = new Set(events)
    await db.completions.bulkDelete(completions.filter((completion) => !completionIds.has(completion.id)).map((completion) => completion.id))
    await db.itemEvents.bulkDelete(events.filter((event) => !eventIds.has(event.id)).map((event) => event.id))
    await db.completions.bulkPut(plan.completions.filter((completion) => !originalCompletions.has(completion)))
    await db.itemEvents.bulkPut(plan.events.filter((event) => !originalEvents.has(event)))
    if (plan.itemUpdate) await db.items.put(plan.itemUpdate)
    await db.profile.put(plan.profile)
    return plan
  })
}
