import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  BOSSES,
  bossXp,
  completeDatesOf,
  evaluateBossDay,
  isBossDueOn,
  planBossSync,
  randomInt,
  rollDelay,
  shiftKey,
} from '../src/lib/bosses.ts'
import { planDayCorrection } from '../src/lib/dayCorrections.ts'
import { computeMissedPenalties } from '../src/lib/penalties.ts'
import { defaultRoutes } from '../src/lib/routes.ts'

const BAT = BOSSES['giant-bat']

function chore(id, changes = {}) {
  return {
    id, title: id, type: 'chore', difficulty: 'easy', trackingType: 'boolean',
    archived: false, createdAt: '2026-10-01T12:00:00', ...changes,
  }
}

function done(itemId, date, changes = {}) {
  return { id: `${itemId}:${date}`, itemId, date, xpEarned: 10, coinsEarned: 2, createdAt: `${date}T12:00:00`, ...changes }
}

function byItem(completions) {
  return Object.groupBy(completions, (completion) => completion.itemId)
}

function profile(changes = {}) {
  return {
    id: 1, level: 1, xp: 0, coins: 0, postponeTokens: 0, vitalityPotions: 0, hp: 50, maxHp: 50,
    streakFreezes: 0, routes: defaultRoutes(), equippedRoute: null, hardcore: true, dead: false,
    runStartedAt: '2026-10-01T02:00:00', ...changes,
  }
}

function activeBoss(windowStart = '2026-10-10', changes = {}) {
  return {
    id: 'giant-bat:1', bossId: 'giant-bat', sequence: 1, status: 'active', scheduledFor: windowStart,
    windowStart, windowEnd: shiftKey(windowStart, 4), rewardGranted: false, damageApplied: false,
    createdAt: '2026-10-01T00:00:00.000Z', ...changes,
  }
}

function sync(state, today, random = () => 0) {
  return planBossSync({
    today, profile: state.profile ?? profile(), items: state.items ?? [], encounters: state.encounters ?? [],
    completionsByItem: byItem(state.completions ?? []), random,
  })
}

test('el retraso es un entero entre 10 y 15, ambos posibles', () => {
  assert.equal(rollDelay(BAT, () => 0), 10)
  assert.equal(rollDelay(BAT, () => 0.9999999), 15)
  const seen = new Set(Array.from({ length: 600 }, () => rollDelay(BAT)))
  assert.deepEqual([...seen].sort((a, b) => a - b), [10, 11, 12, 13, 14, 15])
  assert.equal(randomInt(0, 2, () => 0.999999), 2)
})

test('la EXP se reduce al 70 % redondeando hacia arriba solo mientras el boss está activo', () => {
  const boss = activeBoss()
  assert.equal(bossXp(10, boss, '2026-10-10'), 7)
  assert.equal(bossXp(15, boss, '2026-10-10'), 11)
  assert.equal(bossXp(5, boss, '2026-10-10'), 4)
  assert.equal(bossXp(20, boss, '2026-10-14'), 14)
  assert.equal(bossXp(10, boss, '2026-10-15'), 10)
  assert.equal(bossXp(10, boss, '2026-10-09'), 10)
  assert.equal(bossXp(10, { ...boss, status: 'victory' }, '2026-10-10'), 10)
  assert.equal(bossXp(10, null, '2026-10-10'), 10)
})

test('solo cuentan obligaciones recurrentes y pergaminos que vencen ese día', () => {
  const day = '2026-10-12'
  assert.equal(isBossDueOn(chore('a'), day), true)
  assert.equal(isBossDueOn(chore('h', { type: 'habit' }), day), false)
  assert.equal(isBossDueOn(chore('s', { commitment: 'sideQuest' }), day), false)
  assert.equal(isBossDueOn(chore('r', { commitment: 'sideQuest', routeId: 'technomancer' }), day), false)
  assert.equal(isBossDueOn(chore('x', { archived: true }), day), false)
  assert.equal(isBossDueOn(chore('n', { createdAt: '2026-10-13T12:00:00' }), day), false)
  const scroll = chore('t', { type: 'todo', dueDate: day, startDate: '2026-10-01' })
  assert.equal(isBossDueOn(scroll, day), true)
  assert.equal(isBossDueOn(scroll, '2026-10-11'), false)
  assert.equal(isBossDueOn({ ...scroll, postponedUntil: '2026-10-13' }, day), false)
  assert.equal(isBossDueOn({ ...scroll, postponedUntil: '2026-10-13' }, '2026-10-13'), true)
})

test('un día completo exige al menos una obligación y todas cumplidas', () => {
  const items = [chore('a'), chore('b')]
  const day = '2026-10-12'
  assert.deepEqual(evaluateBossDay([], {}, day), { due: 0, done: 0, complete: false })
  assert.equal(evaluateBossDay(items, byItem([done('a', day)]), day).complete, false)
  assert.deepEqual(evaluateBossDay(items, byItem([done('a', day), done('b', day)]), day), { due: 2, done: 2, complete: true })
  // Las misiones secundarias no cuentan ni como pendientes.
  assert.equal(evaluateBossDay([chore('a'), chore('q', { commitment: 'sideQuest' })], byItem([done('a', day)]), day).complete, true)
})

test('los días completos no tienen que ser consecutivos y no se cuenta el futuro', () => {
  const items = [chore('a')]
  const completions = [done('a', '2026-10-10'), done('a', '2026-10-12'), done('a', '2026-10-14')]
  const boss = activeBoss()
  assert.deepEqual(completeDatesOf(boss, items, byItem(completions), '2026-10-12'), ['2026-10-10', '2026-10-12'])
  assert.deepEqual(completeDatesOf(boss, items, byItem(completions), '2026-10-10'), ['2026-10-10'])
})

test('la primera programación se hace una vez y se mantiene estable', () => {
  const first = sync({}, '2026-10-01', () => 0.5)
  assert.equal(first.encounters.length, 1)
  assert.equal(first.encounters[0].status, 'scheduled')
  assert.equal(first.encounters[0].scheduledFor, shiftKey('2026-10-01', 13))
  const again = sync({ encounters: first.encounters }, '2026-10-02', () => 0)
  assert.equal(again.changed.length, 0)
  assert.equal(again.profile.hp, 50)
})

test('se activa al llegar su día con una ventana de cinco fechas', () => {
  const scheduled = sync({}, '2026-10-01', () => 0).encounters
  assert.equal(scheduled[0].scheduledFor, '2026-10-11')
  assert.equal(sync({ encounters: scheduled }, '2026-10-10').changed.length, 0)
  const activated = sync({ encounters: scheduled }, '2026-10-11')
  const [boss] = activated.encounters
  assert.equal(boss.status, 'active')
  assert.equal(boss.windowStart, '2026-10-11')
  assert.equal(boss.windowEnd, '2026-10-15')
  assert.equal(sync({ encounters: activated.encounters }, '2026-10-11').changed.length, 0)
})

test('la victoria llega con dos días completos, concede una sola vez y programa el enfriamiento', () => {
  const items = [chore('a')]
  const completions = [done('a', '2026-10-10'), done('a', '2026-10-12')]
  const state = { items, completions, encounters: [activeBoss()], profile: profile({ level: 10 }) }
  const result = sync(state, '2026-10-12', () => 0)
  const victory = result.encounters.find((encounter) => encounter.sequence === 1)
  assert.equal(victory.status, 'victory')
  assert.equal(victory.resolvedOn, '2026-10-12')
  assert.equal(victory.rewardGranted, true)
  assert.equal(victory.rewardResource, 'postponeToken')
  assert.equal(victory.nextActivationOn, '2026-10-22')
  assert.equal(result.profile.xp, 100)
  assert.equal(result.profile.coins, 50)
  assert.equal(result.profile.postponeTokens, 1)
  const next = result.encounters.find((encounter) => encounter.sequence === 2)
  assert.equal(next.status, 'cooldown')
  assert.equal(next.scheduledFor, '2026-10-22')

  const repeated = sync({ ...state, profile: result.profile, encounters: result.encounters }, '2026-10-12')
  assert.equal(repeated.changed.length, 0)
  assert.equal(repeated.profile, result.profile)
  const later = sync({ ...state, profile: result.profile, encounters: result.encounters }, '2026-10-14')
  assert.equal(later.changed.length, 0)
})

test('el recurso de la victoria sale de los tres consumibles', () => {
  const state = { items: [chore('a')], completions: [done('a', '2026-10-10'), done('a', '2026-10-11')], encounters: [activeBoss()] }
  const resources = [0, 0.4, 0.9].map((value) => {
    const result = sync(state, '2026-10-11', () => value)
    return result.encounters[0].rewardResource
  })
  assert.deepEqual(resources, ['postponeToken', 'vitalityPotion', 'streakFreeze'])
  const vigor = sync(state, '2026-10-11', () => 0.4).profile
  assert.equal(vigor.vitalityPotions, 1)
  assert.equal(vigor.postponeTokens, 0)
})

test('la recompensa sube de nivel como una completación normal', () => {
  const state = {
    items: [chore('a')], completions: [done('a', '2026-10-10'), done('a', '2026-10-11')],
    encounters: [activeBoss()], profile: profile({ hp: 20 }),
  }
  const result = sync(state, '2026-10-11')
  assert.equal(result.leveledUp, true)
  assert.equal(result.profile.level, 2)
  assert.equal(result.profile.hp, 55)
})

test('la derrota aplica 20 de daño directo una sola vez, sin gastar defensas', () => {
  const state = {
    items: [chore('a')], completions: [done('a', '2026-10-10')],
    encounters: [activeBoss()], profile: profile({ streakFreezes: 2, shieldReadyOn: undefined }),
  }
  assert.equal(sync(state, '2026-10-14').changed.length, 0)
  const result = sync(state, '2026-10-16', () => 0.9999999)
  const defeat = result.encounters[0]
  assert.equal(defeat.status, 'defeat')
  assert.equal(defeat.damageApplied, true)
  assert.equal(defeat.resolvedOn, '2026-10-15')
  assert.equal(defeat.nextActivationOn, '2026-10-30')
  assert.equal(result.profile.hp, 30)
  assert.equal(result.profile.streakFreezes, 2)
  assert.equal(result.profile.coins, 0)
  const repeated = sync({ ...state, profile: result.profile, encounters: result.encounters }, '2026-10-16')
  assert.equal(repeated.changed.length, 0)
  assert.equal(repeated.profile, result.profile)
})

test('la derrota puede terminar la expedición en Hardcore y entonces no se sigue evaluando', () => {
  const state = { items: [chore('a')], encounters: [activeBoss()], profile: profile({ hp: 15 }) }
  const result = sync(state, '2026-10-16')
  assert.equal(result.profile.hp, 0)
  assert.equal(result.profile.dead, true)
  const dead = sync({ ...state, profile: result.profile, encounters: result.encounters }, '2026-10-17')
  assert.equal(dead.changed.length, 0)
})

test('tras una ausencia larga la ventana empieza el día en que vuelves', () => {
  const scheduled = sync({}, '2026-10-01').encounters
  const result = sync({ encounters: scheduled, items: [chore('a')] }, '2026-12-01')
  assert.equal(result.encounters[0].windowStart, '2026-12-01')
  assert.equal(result.encounters[0].status, 'active')
  assert.equal(result.profile.hp, 50)
})

test('una corrección guarda la EXP reducida si el boss está activo ese día', (context) => {
  context.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 9, 28, 12).getTime() })
  const yesterday = '2026-10-27'
  const items = [chore('clean', { createdAt: '2026-10-26T12:00:00' })]
  const penalties = computeMissedPenalties(items, {}, '2026-10-26', 0, { enabled: false }, yesterday)
  const state = profile({
    hp: 50 - penalties.totalDamage, runStartedAt: '2026-10-26T02:00:00', lastPenaltyCheck: yesterday,
    penaltyCheckpoint: { date: yesterday, items, freezes: 0, shieldEnabled: false },
  })
  const input = { itemId: 'clean', date: yesterday, quantity: 1 }
  const plain = planDayCorrection(input, state, items, [], penalties.missedEvents)
  assert.equal(plain.profile.xp, 10)
  const boss = activeBoss('2026-10-26')
  const reduced = planDayCorrection(input, state, items, [], penalties.missedEvents, undefined, undefined, boss)
  assert.equal(reduced.profile.xp, 7)
  assert.equal(reduced.completions[0].xpEarned, 7)
})
