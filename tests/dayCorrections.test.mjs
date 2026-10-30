import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { addDays, format, parseISO } from 'date-fns'
import {
  planDayCorrection,
  CorrectionDeathError,
  groupCorrectionCandidates,
  isCorrectionDay,
} from '../src/lib/dayCorrections.ts'
import { BOSSES } from '../src/lib/bosses.ts'
import { computeMissedPenalties } from '../src/lib/penalties.ts'
import { defaultRoutes } from '../src/lib/routes.ts'
import { buildItemStats } from '../src/lib/itemStats.ts'
import { buildDaySummary } from '../src/lib/calendar.ts'
import { buildDailyStats } from '../src/lib/stats.ts'

const today = '2026-10-28'
const yesterday = '2026-10-27'
beforeEach((context) => {
  context.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 9, 28, 12).getTime() })
})

function activity(changes = {}) {
  return {
    id: 'clean', title: 'Limpiar', type: 'chore', difficulty: 'easy',
    trackingType: 'boolean', archived: false, createdAt: '2026-10-26T12:00:00',
    ...changes,
  }
}

function fixture({ items = [activity()], completions = [], freezes = 0, shield = false } = {}) {
  const history = Object.groupBy(completions, (completion) => completion.itemId)
  const penalties = computeMissedPenalties(items, history, '2026-10-26', freezes, { enabled: shield }, yesterday)
  return {
    items, completions, events: penalties.missedEvents,
    profile: {
      id: 1, level: 1, xp: 0, coins: 0, postponeTokens: 0, vitalityPotions: 0,
      hp: 50 - penalties.totalDamage, maxHp: 50, streakFreezes: freezes - penalties.freezesUsed,
      routes: defaultRoutes(), equippedRoute: null, shieldReadyOn: penalties.shieldReadyOn,
      hardcore: true, dead: false, runStartedAt: '2026-10-26T02:00:00', lastPenaltyCheck: yesterday,
      penaltyCheckpoint: { date: yesterday, items, freezes, shieldEnabled: shield },
    },
  }
}

function correct(state, quantity, options = {}) {
  const result = planDayCorrection(
    { itemId: options.itemId ?? 'clean', date: options.date ?? yesterday, quantity },
    state.profile, state.items, state.completions, state.events, options.confirmedDamage,
    undefined, options.boss,
  )
  return { ...result, items: state.items }
}

function completion(itemId = 'clean', date = yesterday, changes = {}) {
  return {
    id: `${itemId}:${date}`, itemId, date, xpEarned: 10, coinsEarned: 2,
    createdAt: `${date}T12:00:00`, ...changes,
  }
}

test('registrar ayer devuelve daño y registra la actividad en ayer, no como recuperación tardía', () => {
  const state = fixture()
  assert.equal(state.profile.hp, 49)
  const next = correct(state, 1)
  assert.equal(next.profile.hp, 50)
  assert.equal(next.profile.xp, 10)
  assert.equal(next.profile.coins, 2)
  assert.equal(next.completions[0].date, yesterday)
  assert.equal(next.events.filter((event) => event.kind === 'missed').length, 0)
  assert.equal(next.events[0].kind, 'completed')
  assert.equal(next.events[0].activityDate, yesterday)
})

test('agrupa fallos, registros, pendientes y misiones secundarias en ese orden semántico', () => {
  const runStartedAt = '2026-10-26T02:00:00'
  const items = [
    activity({ id: 'damaged' }),
    activity({ id: 'protected' }),
    activity({ id: 'registered' }),
    activity({ id: 'pending' }),
    activity({ id: 'quest', commitment: 'sideQuest', routeId: 'technomancer' }),
  ]
  const events = [
    {
      id: 'damaged:missed', itemId: 'damaged', kind: 'missed', scheduledDate: yesterday,
      activityDate: yesterday, occurredAt: `${yesterday}T12:00:00`, damage: 2, runStartedAt,
    },
    {
      id: 'protected:missed', itemId: 'protected', kind: 'missed', scheduledDate: yesterday,
      activityDate: yesterday, occurredAt: `${yesterday}T12:00:00`, damage: 0,
      protectedBy: 'freeze', runStartedAt,
    },
    {
      id: 'other-run:missed', itemId: 'pending', kind: 'missed', scheduledDate: yesterday,
      activityDate: yesterday, occurredAt: `${yesterday}T12:00:00`, damage: 99,
      runStartedAt: '2026-10-20T02:00:00',
    },
  ]
  const groups = groupCorrectionCandidates(
    items,
    { registered: [completion('registered')] },
    yesterday,
    events,
    items,
    runStartedAt,
  )

  assert.deepEqual(groups.failed.map((item) => item.id), ['damaged', 'protected'])
  assert.deepEqual(groups.registered.map((item) => item.id), ['registered'])
  assert.deepEqual(groups.pending.map((item) => item.id), ['pending'])
  assert.deepEqual(groups.sideQuests.map((item) => item.id), ['quest'])
  assert.equal(groups.failureEvents.protected[0].protectedBy, 'freeze')
})

test('guardar dos veces es idempotente y desmarcar revierte recompensas y daño', () => {
  const first = correct(fixture(), 1)
  const second = correct(first, 1)
  assert.deepEqual(second.profile, first.profile)
  assert.deepEqual(second.completions, first.completions)
  assert.deepEqual(second.events, first.events)
  const undone = correct(second, 0)
  assert.equal(undone.profile.hp, 49)
  assert.equal(undone.profile.xp, 0)
  assert.equal(undone.profile.coins, 0)
  assert.equal(undone.completions.length, 0)
})

test('corregir ayer recalcula el daño de una estatua sin duplicar el evento', () => {
  const item = activity({ createdAt: `${yesterday}T12:00:00` })
  const state = fixture({ items: [item] })
  const boss = {
    id: 'enc:medusa', bossId: 'medusa', sequence: 1, status: 'active',
    scheduledFor: yesterday, windowStart: yesterday, windowEnd: '2026-10-31',
    goal: 4, rewardGranted: false, damageApplied: false,
  }
  assert.equal(BOSSES.medusa.id, 'medusa')
  assert.equal(state.events.filter((event) => event.kind === 'missed').length, 1)
  assert.equal(state.events[0].damage, 1)
  const restored = correct(state, 1, { boss })
  assert.equal(restored.profile.hp, 50)
  assert.equal(restored.events.filter((event) => event.kind === 'missed').length, 0)
  const undone = correct(restored, 0, { boss })
  const missed = undone.events.filter((event) => event.kind === 'missed')
  assert.equal(missed.length, 1)
  assert.equal(missed[0].damage, 2)
  assert.equal(undone.profile.hp, 48)
})

test('no permite retirar oro gastado ni modifica las entradas al fallar', () => {
  const state = correct(fixture(), 1)
  state.profile.coins = 0
  const original = structuredClone(state)
  assert.throws(() => correct(state, 0), /Necesitas 2 de oro/)
  assert.deepEqual(state, original)
})

test('conserva los niveles alcanzados y resta solo EXP disponible', () => {
  const state = correct(fixture(), 1)
  state.profile = { ...state.profile, level: 3, maxHp: 60, hp: 60, xp: 2 }
  const next = correct(state, 0)
  assert.equal(next.profile.level, 3)
  assert.equal(next.profile.maxHp, 60)
  assert.equal(next.profile.xp, 0)
})

test('una nueva recompensa puede subir de nivel con su curación habitual', () => {
  const state = fixture()
  state.profile.xp = 70
  const next = correct(state, 1)
  assert.equal(next.profile.level, 2)
  assert.equal(next.profile.xp, 5)
  assert.equal(next.profile.hp, 55)
  assert.equal(next.leveledUp, true)
})

test('recalcula y reasigna una congelación al siguiente fallo; la devuelve al corregir todos', () => {
  const state = fixture({ items: [activity(), activity({ id: 'cook' })], freezes: 1 })
  assert.equal(state.profile.hp, 49)
  const next = correct(state, 1)
  assert.equal(next.profile.hp, 50)
  assert.equal(next.profile.streakFreezes, 0)
  const miss = next.events.find((event) => event.kind === 'missed')
  assert.equal(miss.itemId, 'cook')
  assert.equal(miss.protectedBy, 'freeze')
  const allDone = correct(next, 1, { itemId: 'cook' })
  assert.equal(allDone.profile.streakFreezes, 1)
  const undone = correct(allDone, 0)
  assert.equal(undone.profile.streakFreezes, 0)
  assert.equal(undone.events.find((event) => event.kind === 'missed').protectedBy, 'freeze')
})

test('no permite consumir de nuevo una congelación devuelta que ya se ha gastado', () => {
  const done = correct(fixture({ freezes: 1 }), 1)
  done.profile.streakFreezes = 0
  assert.throws(() => correct(done, 0), /No quedan suficientes congelaciones/)
})

test('reasigna el escudo y restaura su disponibilidad al desaparecer los fallos', () => {
  const state = fixture({ items: [activity(), activity({ id: 'cook' })], shield: true })
  const next = correct(state, 1)
  assert.equal(next.events.find((event) => event.kind === 'missed').protectedBy, 'shield')
  assert.equal(next.profile.shieldReadyOn, '2026-11-11')
  const allDone = correct(next, 1, { itemId: 'cook' })
  assert.equal(allDone.profile.shieldReadyOn, undefined)
})

test('corregir un fallo más antiguo no altera su daño cuando la recuperación sigue siendo tardía', () => {
  const item = activity({ type: 'todo', dueDate: '2026-10-26' })
  const state = fixture({ items: [item] })
  const historicalMiss = {
    id: 'historical', itemId: item.id, itemTitle: item.title, itemType: item.type,
    kind: 'missed', scheduledDate: '2026-10-26', activityDate: '2026-10-26',
    occurredAt: '2026-10-27T12:00:00', damage: 1,
  }
  state.events.push(historicalMiss)
  const next = correct(state, 1)
  assert.ok(next.events.some((event) => event.id === 'historical'))
  assert.equal(next.events.find((event) => event.kind === 'lateRecovery').activityDate, yesterday)
})

test('cantidades parciales no recompensan; alcanzar y perder la meta ajusta el resultado', () => {
  const state = fixture({ items: [activity({ trackingType: 'quantity', quantityGoal: 10 })] })
  const partial = correct(state, 5)
  assert.equal(partial.profile.coins, 0)
  assert.equal(partial.profile.hp, 49)
  const done = correct(partial, 10)
  assert.equal(done.profile.coins, 2)
  assert.equal(done.profile.hp, 50)
  const lowered = correct(done, 8)
  assert.equal(lowered.profile.coins, 0)
  assert.equal(lowered.profile.hp, 49)
  assert.equal(lowered.completions[0].quantityDone, 8)
})

test('completar una aparición aplazada limpia el aplazamiento activo', () => {
  const item = activity({ postponedFrom: yesterday, postponedUntil: today })
  const state = fixture({ items: [item] })
  const next = correct(state, 1, { date: today })
  assert.equal(next.itemUpdate.postponedFrom, undefined)
  assert.equal(next.itemUpdate.postponedUntil, undefined)
})

test('corregir ayer conserva la meta de ayer aunque hoy se haya cambiado', () => {
  const state = fixture({ items: [activity({ trackingType: 'quantity', quantityGoal: 10 })] })
  state.items = state.items.map((item) => ({ ...item, quantityGoal: 20 }))
  const next = correct(state, 10)
  assert.equal(next.completions[0].quantityGoal, 10)
  assert.equal(next.profile.hp, 50)
  assert.equal(next.completions[0].xpEarned, 10)
  const summary = buildDaySummary(state.items, Object.groupBy(next.completions, (entry) => entry.itemId), parseISO(yesterday))
  assert.equal(summary.done.length, 1)
})

test('rechaza cantidades negativas, fraccionarias, no numéricas o mayores que la meta', () => {
  for (const quantity of [-1, 0.5, NaN, 2]) {
    assert.throws(() => correct(fixture(), quantity), /cantidad entera/)
  }
})

test('bloquea días anteriores a ayer y fechas futuras', () => {
  for (const date of ['2026-10-26', '2026-10-29']) {
    assert.throws(() => correct(fixture(), 1, { date }), /Solo se pueden corregir hoy y ayer/)
  }
})

test('el día operativo cambia exactamente a las 02:00', (context) => {
  context.mock.timers.setTime(new Date(2026, 9, 28, 1, 59, 59).getTime())
  assert.equal(isCorrectionDay('2026-10-26'), true)
  assert.equal(isCorrectionDay('2026-10-28'), false)
  context.mock.timers.setTime(new Date(2026, 9, 28, 2).getTime())
  assert.equal(isCorrectionDay('2026-10-26'), false)
  assert.equal(isCorrectionDay('2026-10-28'), true)
})

test('una actividad creada de madrugada se puede corregir en su día operativo', () => {
  const state = fixture({ items: [activity({ createdAt: '2026-10-28T01:00:00' })] })
  const next = correct(state, 1)
  assert.equal(next.completions[0].date, yesterday)
  assert.equal(next.profile.hp, 50)
})

test('una nueva actividad no borra eventos de otra expedición en el mismo día', () => {
  const state = fixture()
  state.profile.runStartedAt = `${today}T10:00:00`
  state.profile.penaltyCheckpoint = { date: yesterday, items: [], freezes: 0, shieldEnabled: false }
  const previousEvent = {
    id: 'previous-run-event', itemId: 'clean', itemTitle: 'Limpiar', itemType: 'chore',
    kind: 'undone', scheduledDate: today, activityDate: today, occurredAt: `${today}T09:00:00`,
  }
  state.events.push(previousEvent)
  const next = correct(state, 1, { date: today })
  assert.ok(next.events.some((event) => event.id === previousEvent.id))
  assert.equal(next.events.filter((event) => event.kind === 'completed').length, 1)
})

test('no resucita personajes ni permite editar registros de otra expedición', () => {
  const dead = fixture()
  dead.profile.dead = true
  assert.throws(() => correct(dead, 1), /expedición terminada/)
  const restarted = fixture()
  restarted.profile.runStartedAt = `${today}T02:00:00`
  assert.throws(() => correct(restarted, 1), /expedición anterior/)
  const legacy = fixture()
  delete legacy.profile.runStartedAt
  assert.throws(() => correct(legacy, 1), /Confirma primero/)
})

test('una muerte necesita confirmación y no escribe cambios al cancelarse', () => {
  const state = correct(fixture(), 1)
  state.profile.hp = 1
  const original = structuredClone(state)
  assert.throws(() => correct(state, 0), CorrectionDeathError)
  assert.deepEqual(state, original)
  const next = correct(state, 0, { confirmedDamage: 1 })
  assert.equal(next.profile.hp, 0)
  assert.equal(next.profile.dead, true)
  assert.throws(() => correct(next, 1), /expedición terminada/)
})

test('una aparición con margen no duplica registros de otro día', () => {
  const item = activity({
    recurrenceRule: 'DTSTART:20261026T120000Z\nRRULE:FREQ=DAILY;INTERVAL=3',
    windowDays: 3,
  })
  const state = fixture({ items: [item], completions: [completion('clean', '2026-10-26')] })
  assert.throws(() => correct(state, 1), /registro del 2026-10-26/)
  const future = fixture({ items: [item], completions: [completion('clean', today)] })
  assert.throws(() => correct(future, 1), /registro posterior/)
})

test('el calendario y las estadísticas coinciden con el estado corregido sin sumar el fallo eliminado', () => {
  const done = correct(fixture(), 1)
  const history = Object.groupBy(done.completions, (entry) => entry.itemId)
  const summary = buildDaySummary(done.items, history, parseISO(yesterday))
  const stats = buildItemStats(done.events).clean
  assert.equal(summary.done.length, 1)
  assert.equal(summary.xp, 10)
  assert.equal(stats.completed, 1)
  assert.equal(stats.missed, 0)
  assert.equal(stats.totalXp, 10)
  const undone = correct(done, 0)
  const nextStats = buildItemStats(undone.events).clean
  assert.equal(nextStats.completed, 0)
  assert.equal(nextStats.totalXp, 0)
  assert.equal(nextStats.missed, 1)
})

test('el mapa de constancia reconoce fallos y defensas con identificadores de expedición', () => {
  for (const freezes of [0, 1]) {
    const state = fixture({ freezes })
    state.profile.penaltyCheckpoint.runStartedAt = state.profile.runStartedAt
    const done = correct(state, 1)
    const undone = correct(done, 0)
    const history = Object.groupBy(undone.completions, (entry) => entry.itemId)
    const days = buildDailyStats(undone.items, history, 2, undone.events)
    assert.equal(days.find((day) => day.key === yesterday).status, freezes ? 'protected' : 'damaged')
  }
})

test('recalcula tramos ya ganados de rutas y desequipa una pasiva que vuelve a estar bloqueada', () => {
  const items = ['study', 'code'].map((id) => activity({
    id, routeId: 'technomancer', type: 'habit', commitment: 'sideQuest',
    createdAt: '2026-10-08T12:00:00',
  }))
  const completions = []
  for (let day = 0; day < 20; day++) {
    const date = format(addDays(parseISO('2026-10-08'), day), 'yyyy-MM-dd')
    for (const item of items) completions.push(completion(item.id, date))
  }
  const state = fixture({ items, completions })
  state.profile = {
    ...state.profile, coins: 10, runStartedAt: '2026-10-08T02:00:00', equippedRoute: 'technomancer',
    routes: { ...defaultRoutes(), technomancer: { level: 1, windowStart: today, startedOn: '2026-10-08' } },
  }
  const next = correct(state, 0, { itemId: 'study' })
  assert.equal(next.profile.routes.technomancer.level, 0)
  assert.equal(next.profile.equippedRoute, null)
})

test('una corrección ajena a una ruta no modifica sus tramos ya ganados', () => {
  const state = fixture()
  state.profile.routes.technomancer = { level: 2, windowStart: today, startedOn: '2026-08-01' }
  const next = correct(state, 1)
  assert.deepEqual(next.profile.routes.technomancer, state.profile.routes.technomancer)
})
