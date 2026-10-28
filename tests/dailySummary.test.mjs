import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { buildDailySummary, summaryDateKey } from '../src/lib/dailySummary.ts'
import { planDayCorrection, reconcileSnapshot } from '../src/lib/dayCorrections.ts'
import { addXp, rewindXp } from '../src/lib/gamification.ts'
import { computeMissedPenalties } from '../src/lib/penalties.ts'
import { defaultRoutes } from '../src/lib/routes.ts'
import { clearSummaryMarker, hasShownSummary, markSummaryShown } from '../src/lib/summaryMarker.ts'

const yesterday = '2026-10-27'
const runStartedAt = '2026-10-20T02:00:00'

beforeEach((context) => {
  context.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 9, 28, 12).getTime() })
})

function item(changes = {}) {
  return {
    id: 'clean', title: 'Limpiar', type: 'chore', difficulty: 'easy', trackingType: 'boolean',
    archived: false, createdAt: '2026-10-20T12:00:00', ...changes,
  }
}

function completion(itemId = 'clean', date = yesterday, changes = {}) {
  return {
    id: `${itemId}:${date}`, itemId, date, xpEarned: 10, coinsEarned: 2,
    createdAt: `${date}T12:00:00`, ...changes,
  }
}

function profile(changes = {}) {
  return {
    id: 1, level: 1, xp: 0, coins: 0, postponeTokens: 0, vitalityPotions: 0, hp: 50, maxHp: 50,
    streakFreezes: 0, routes: defaultRoutes(), equippedRoute: null, hardcore: true, dead: false,
    runStartedAt, lastPenaltyCheck: yesterday, ...changes,
  }
}

function snapshot(changes = {}) {
  return { date: yesterday, runStartedAt, level: 1, xp: 0, hp: 50, maxHp: 50, ...changes }
}

function group(completions) {
  return Object.groupBy(completions, (entry) => entry.itemId)
}

function summarize({ items = [item()], completions = [], events = [], profileChanges, snap = snapshot(), date = yesterday } = {}) {
  return buildDailySummary({
    date, profile: profile(profileChanges), items, completionsByItem: group(completions), events, snapshot: snap,
  })
}

function missed(title, changes = {}) {
  return {
    id: `${title}:missed`, itemId: title, itemTitle: title, itemType: 'chore', kind: 'missed',
    scheduledDate: yesterday, activityDate: yesterday, occurredAt: '2026-10-28T09:00:00', damage: 1, ...changes,
  }
}

test('el resumen siempre es de ayer y respeta el corte de las 02:00', (context) => {
  context.mock.timers.setTime(new Date(2026, 9, 28, 1, 30).getTime())
  assert.equal(summaryDateKey(), '2026-10-26')
  context.mock.timers.setTime(new Date(2026, 9, 28, 2, 30).getTime())
  assert.equal(summaryDateKey(), '2026-10-27')
  // Varios días sin entrar: sigue siendo solo ayer.
  context.mock.timers.setTime(new Date(2026, 10, 3, 12).getTime())
  assert.equal(summaryDateKey(), '2026-11-02')
})

test('reúne actividades, recompensas, fallos con daño y protegidos', () => {
  const summary = summarize({
    items: [item(), item({ id: 'old', title: 'Archivada', archived: true }), item({ id: 'q', title: 'Correr', commitment: 'sideQuest' })],
    completions: [completion('clean'), completion('old', yesterday, { xpEarned: 5, coinsEarned: 1 })],
    events: [
      missed('Fregar', { damage: 2 }),
      missed('Regar', { damage: 0, protectedBy: 'shield' }),
    ],
  })
  assert.deepEqual(summary.done.map((entry) => entry.title).sort(), ['Archivada', 'Limpiar'])
  assert.equal(summary.xpGained, 15)
  assert.equal(summary.coinsGained, 3)
  assert.equal(summary.damage, 2)
  assert.equal(summary.protectedCount, 1)
  assert.deepEqual(summary.missed.map((miss) => miss.title), ['Fregar', 'Regar'])
  assert.equal(summary.hasContent, true)
})

test('ignora marcadores de recuperación tardía, otros días y otras expediciones', () => {
  const summary = summarize({
    events: [
      missed('Tardía', { damage: 0 }),
      missed('Anteayer', { activityDate: '2026-10-26' }),
      missed('Otra expedición', { runStartedAt: '2026-10-01T02:00:00', occurredAt: '2026-10-10T09:00:00' }),
    ],
    completions: [completion('clean', yesterday, { createdAt: '2026-10-19T12:00:00' })],
  })
  assert.equal(summary.missed.length, 0)
  assert.equal(summary.done.length, 0)
  assert.equal(summary.hasContent, false)
})

test('no hay resumen si el día es de una expedición anterior o el personaje ha caído', () => {
  assert.equal(summarize({ profileChanges: { runStartedAt: '2026-10-28T09:00:00' } }), null)
  assert.equal(summarize({ profileChanges: { dead: true } }), null)
})

test('una cantidad sin alcanzar la meta no cuenta como actividad cumplida', () => {
  const walk = item({ id: 'walk', trackingType: 'quantity', quantityGoal: 10, unit: 'min' })
  const partial = summarize({ items: [walk], completions: [completion('walk', yesterday, { quantityDone: 4, quantityGoal: 10 })] })
  assert.equal(partial.done.length, 0)
  const full = summarize({ items: [walk], completions: [completion('walk', yesterday, { quantityDone: 10, quantityGoal: 10 })] })
  assert.equal(full.done[0].quantityDone, 10)
})

test('el nivel anterior se deduce de la EXP del día y detecta subidas', () => {
  assert.deepEqual(rewindXp(3, 10, 60), { level: 2, xp: 50 })
  assert.deepEqual(rewindXp(1, 5, 20), { level: 1, xp: 0 })
  for (const [level, xp, gain] of [[1, 0, 10], [2, 90, 30], [4, 10, 400]]) {
    const next = addXp(level, xp, gain)
    assert.deepEqual(rewindXp(next.level, next.xp, gain), { level, xp })
  }
  const summary = summarize({
    completions: [completion('clean', yesterday, { xpEarned: 60 })],
    snap: snapshot({ level: 3, xp: 10 }),
  })
  assert.equal(summary.vitals.levelBefore, 2)
  assert.equal(summary.vitals.xpBefore, 50)
  assert.equal(summary.vitals.levelsGained, 1)
  assert.equal(summary.vitals.maxHpGain, 5)
})

test('sin snapshot válido no se inventan niveles ni vida', () => {
  assert.equal(summarize({ snap: null }).vitals, null)
  assert.equal(summarize({ snap: snapshot({ runStartedAt: '2026-09-01T02:00:00' }) }).vitals, null)
  assert.equal(summarize({ snap: snapshot({ date: '2026-10-26' }) }).vitals, null)
})

test('rachas y rutas se calculan a la fecha del resumen, no con el estado de hoy', () => {
  const days = Array.from({ length: 3 }, (_, index) => `2026-10-${25 + index}`)
  const streak = summarize({ completions: days.map((day) => completion('clean', day)) })
  assert.deepEqual(streak.streaks, [{ id: 'clean', title: 'Limpiar', streak: 3 }])
  // Completar hoy no altera la racha de ayer.
  const withToday = summarize({ completions: [...days, '2026-10-28'].map((day) => completion('clean', day)) })
  assert.equal(withToday.streaks[0].streak, 3)

  const routeItems = ['a', 'b'].map((id) => item({ id, title: id, routeId: 'technomancer', commitment: 'sideQuest', createdAt: '2026-10-08T12:00:00' }))
  const routeDays = Array.from({ length: 20 }, (_, index) => `2026-10-${String(8 + index).padStart(2, '0')}`)
  const completions = routeItems.flatMap((entry) => routeDays.map((day) => completion(entry.id, day)))
  const routes = { ...defaultRoutes(), technomancer: { level: 1, windowStart: '2026-10-28', startedOn: '2026-10-08' } }
  const summary = summarize({ items: routeItems, completions, profileChanges: { routes } })
  const route = summary.routes.find((entry) => entry.id === 'technomancer')
  assert.equal(route.levelBefore, 0)
  assert.equal(route.levelAfter, 1)
  assert.equal(route.levelUp, true)
  assert.equal(route.passiveName, 'Resonancia Arcana')
  assert.equal(route.goodDay, true)
  assert.equal(summary.hasContent, true)
})

test('consultar el resumen no modifica ningún dato de juego', () => {
  const input = {
    date: yesterday, profile: profile({ coins: 7 }), items: [item()], completionsByItem: group([completion()]),
    events: [missed('Fregar')], snapshot: snapshot(),
  }
  const before = JSON.stringify(input)
  const deepFreeze = (value) => {
    if (value && typeof value === 'object') Object.values(value).forEach(deepFreeze)
    return Object.freeze(value)
  }
  deepFreeze(input)
  const first = buildDailySummary(input)
  const second = buildDailySummary(input)
  assert.deepEqual(first, second)
  assert.equal(JSON.stringify(input), before)
})

function correctionFixture() {
  const items = [item({ createdAt: '2026-10-26T12:00:00' })]
  const penalties = computeMissedPenalties(items, {}, '2026-10-26', 0, { enabled: false }, yesterday)
  const base = profile({
    hp: 50 - penalties.totalDamage, runStartedAt: '2026-10-26T02:00:00',
    penaltyCheckpoint: { date: yesterday, items, freezes: 0, shieldEnabled: false },
  })
  return { items, events: penalties.missedEvents, base }
}

test('corregir ayer recalcula el resumen sin rastro de la edición', () => {
  const { items, events, base } = correctionFixture()
  const snap = snapshot({ runStartedAt: base.runStartedAt, hp: base.hp })
  const view = (state) => buildDailySummary({
    date: yesterday, profile: state.profile, items, completionsByItem: group(state.completions),
    events: state.events, snapshot: state.snapshot,
  })

  const before = view({ profile: base, completions: [], events, snapshot: snap })
  assert.equal(before.missed.length, 1)
  assert.equal(before.damage, 1)
  assert.equal(before.vitals.hp, 49)

  const plan = planDayCorrection({ itemId: 'clean', date: yesterday, quantity: 1 }, base, items, [], events, undefined, snap)
  const after = view({ profile: plan.profile, completions: plan.completions, events: plan.events, snapshot: plan.snapshot })
  assert.equal(after.missed.length, 0)
  assert.equal(after.damage, 0)
  assert.equal(after.done.length, 1)
  assert.equal(after.xpGained, 10)
  assert.equal(after.vitals.hp, 50)
  assert.equal(after.vitals.xpAfter, 10)
  assert.equal(after.vitals.xpBefore, 0)
  assert.deepEqual(Object.keys(after), Object.keys(before))

  const undone = planDayCorrection({ itemId: 'clean', date: yesterday, quantity: 0 }, plan.profile, items, plan.completions, plan.events, undefined, plan.snapshot)
  const reverted = view({ profile: undone.profile, completions: undone.completions, events: undone.events, snapshot: undone.snapshot })
  assert.deepEqual(reverted, before)
})

test('la corrección ajusta el snapshot igual que el perfil, también con subida de nivel', () => {
  assert.deepEqual(reconcileSnapshot(snapshot({ hp: 49 }), 10, -1), snapshot({ hp: 50, xp: 10 }))
  const leveled = reconcileSnapshot(snapshot({ level: 1, xp: 70, hp: 40 }), 10, 0)
  assert.equal(leveled.level, 2)
  assert.equal(leveled.xp, 5)
  assert.equal(leveled.maxHp, 55)
  assert.equal(leveled.hp, 55)
  const lowered = reconcileSnapshot(snapshot({ level: 3, xp: 4 }), -10, 0)
  assert.equal(lowered.level, 3)
  assert.equal(lowered.xp, 0)
})

test('la marca de presentación automática es idempotente y no depende del perfil', () => {
  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
  assert.equal(hasShownSummary(yesterday, storage), false)
  markSummaryShown(yesterday, storage)
  markSummaryShown(yesterday, storage)
  assert.equal(hasShownSummary(yesterday, storage), true)
  assert.equal(hasShownSummary('2026-10-28', storage), false)
  clearSummaryMarker(storage)
  assert.equal(hasShownSummary(yesterday, storage), false)
  assert.equal(hasShownSummary(yesterday, null), false)
  assert.doesNotThrow(() => markSummaryShown(yesterday, { getItem: () => null, setItem: () => { throw new Error('lleno') }, removeItem: () => {} }))
})
