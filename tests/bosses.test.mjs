import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  BOSSES,
  bestiaryMechanic,
  bestiaryOf,
  bestiaryUnlocks,
  bossCountsFor,
  bossGoal,
  bossXp,
  completeDatesOf,
  dailyLoad,
  evaluateBossDay,
  hitProgress,
  isBossDueOn,
  migrateEncounter,
  pickBoss,
  planBossSync,
  randomInt,
  rewardMultiplier,
  rollDelay,
  rollRewards,
  shiftKey,
  splitBars,
  summarizeBoss,
} from '../src/lib/bosses.ts'
import { addCurse, CURSES, cureCost, tickCurses } from '../src/lib/curses.ts'
import { planDayCorrection } from '../src/lib/dayCorrections.ts'
import { canPostpone, modifyCoins, modifyXp, potionRecovery } from '../src/lib/modifiers.ts'
import { computeMissedPenalties } from '../src/lib/penalties.ts'
import { defaultRoutes } from '../src/lib/routes.ts'

const BAT = BOSSES['giant-bat']
const SLOGRA = BOSSES['slogra-gaibon']

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
    streakFreezes: 0, holyWater: 0, curses: [], routes: defaultRoutes(), equippedRoute: null,
    hardcore: true, dead: false, runStartedAt: '2026-10-01T02:00:00', ...changes,
  }
}

function activeBoss(windowStart = '2026-10-10', changes = {}) {
  return {
    id: 'giant-bat:1', bossId: 'giant-bat', sequence: 1, status: 'active', scheduledFor: windowStart,
    windowStart, windowEnd: shiftKey(windowStart, 4), goal: 2, rewardGranted: false, damageApplied: false,
    createdAt: '2026-10-01T00:00:00.000Z', ...changes,
  }
}

function sloBoss(windowStart = '2026-10-10', changes = {}) {
  return activeBoss(windowStart, { id: 'enc:1', bossId: 'slogra-gaibon', goal: 20, ...changes })
}

function sync(state, today, random = () => 0) {
  return planBossSync({
    today, profile: state.profile ?? profile(), items: state.items ?? [], encounters: state.encounters ?? [],
    completionsByItem: byItem(state.completions ?? []), random,
  })
}

/** Devuelve los valores dados y, después, un valor alto constante. */
function sequence(values) {
  let index = 0
  return () => (index < values.length ? values[index++] : 0.99)
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
  assert.equal(bossXp(10, sloBoss(), '2026-10-10'), 10)
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

test('se activa al llegar su día con una ventana de cinco fechas y fija su meta', () => {
  const scheduled = sync({}, '2026-10-01', () => 0).encounters
  assert.equal(scheduled[0].scheduledFor, '2026-10-11')
  assert.equal(sync({ encounters: scheduled }, '2026-10-10').changed.length, 0)
  const activated = sync({ encounters: scheduled }, '2026-10-11')
  const [boss] = activated.encounters
  assert.equal(boss.status, 'active')
  assert.equal(boss.windowStart, '2026-10-11')
  assert.equal(boss.windowEnd, '2026-10-15')
  assert.equal(typeof boss.goal, 'number')
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
  assert.equal(victory.nextActivationOn, '2026-10-22')
  // Nivel 10: premio base ×1,2; con el azar a 0 sale cada objeto, una unidad.
  assert.deepEqual(victory.rewards, {
    xp: 120, coins: 60, items: { postponeToken: 1, vitalityPotion: 1, streakFreeze: 1, holyWater: 1 },
  })
  assert.equal(result.profile.xp, 120)
  assert.equal(result.profile.coins, 60)
  assert.equal(result.profile.postponeTokens, 1)
  assert.equal(result.profile.holyWater, 1)
  const next = result.encounters.find((encounter) => encounter.sequence === 2)
  assert.equal(next.status, 'cooldown')
  assert.equal(next.scheduledFor, '2026-10-22')
  assert.equal(next.bossId, 'slogra-gaibon')

  const repeated = sync({ ...state, profile: result.profile, encounters: result.encounters }, '2026-10-12')
  assert.equal(repeated.changed.length, 0)
  assert.equal(repeated.profile, result.profile)
  const later = sync({ ...state, profile: result.profile, encounters: result.encounters }, '2026-10-14')
  assert.equal(later.changed.length, 0)
})

test('cada objeto del premio se sortea por separado y hay un consuelo si no sale ninguno', () => {
  // Sello falla, poción sale (cantidad 1), congelación y agua bendita fallan.
  const some = rollRewards(BAT, 1, sequence([0.9, 0.1, 0, 0.9, 0.9]))
  assert.deepEqual(some.items, { vitalityPotion: 1 })
  assert.deepEqual([some.xp, some.coins], [100, 50])
  const none = rollRewards(BAT, 1, () => 0.99)
  assert.deepEqual(none.items, { postponeToken: 1 })
  const level = (value) => rollRewards(BAT, value, () => 0.99).xp
  assert.deepEqual([level(1), level(5), level(10), level(20)], [100, 110, 120, 140])
  assert.equal(rewardMultiplier(4), 1)
})

test('el boss de golpes se vence por daño y se anuncia con la ventana de cinco días', () => {
  const state = { items: [chore('a')], encounters: [sync({}, '2026-10-01', () => 0).encounters[0]] }
  assert.equal(state.encounters[0].bossId, 'giant-bat')
  const forced = [{ ...state.encounters[0], bossId: 'slogra-gaibon', scheduledFor: '2026-10-05' }]
  const result = sync({ items: state.items, encounters: forced }, '2026-10-05', () => 0)
  const [boss] = result.encounters
  assert.equal(boss.bossId, 'slogra-gaibon')
  assert.equal(boss.status, 'active')
  assert.equal(boss.windowEnd, '2026-10-09')
  assert.equal(boss.goal, 10)
})

test('cada tarea cumplida golpea según su dificultad, también las creadas durante el combate', () => {
  const items = [
    chore('t', { difficulty: 'trivial' }), chore('m', { difficulty: 'medium', type: 'habit', commitment: 'sideQuest' }),
    chore('h', { difficulty: 'hard' }), chore('late', { difficulty: 'hard', createdAt: '2026-10-11T12:00:00' }),
    chore('q', { difficulty: 'hard', trackingType: 'quantity', quantityGoal: 10 }),
  ]
  const completions = [
    done('t', '2026-10-10'), done('m', '2026-10-10'), done('h', '2026-10-11'), done('late', '2026-10-11'),
    done('q', '2026-10-11', { quantityDone: 4, quantityGoal: 10 }),
    done('t', '2026-10-09'), done('h', '2026-10-16'),
  ]
  const boss = sloBoss()
  const progress = hitProgress(boss, items, byItem(completions), '2026-10-12')
  // trivial 1 + media 3 + difícil 5 + la tarea nueva (difícil 5); no la cantidad a medias ni lo de fuera de ventana.
  assert.equal(progress.damage, 14)
  assert.equal(progress.reachedOn, undefined)
  const summary = summarizeBoss(boss, items, byItem(completions), '2026-10-12')
  assert.equal(summary.damage, 14)
  assert.equal(summary.goal, 20)
})

test('el daño pasa de una barra a la siguiente y las barras suman la vida total', () => {
  const [first, second] = splitBars(SLOGRA, 20, 0)
  assert.deepEqual([first.name, first.max, second.name, second.max], ['Slogra', 11, 'Gaibon', 9])
  const [slogra, gaibon] = splitBars(SLOGRA, 20, 15)
  assert.deepEqual([slogra.hp, gaibon.hp], [0, 5])
  const [overkill, last] = splitBars(SLOGRA, 20, 99)
  assert.deepEqual([overkill.hp, last.hp], [0, 0])
})

test('la vida del boss de golpes sigue tu carga real, con mínimo y máximo', () => {
  const daily = Array.from({ length: 6 }, (_, index) => chore(`d${index}`, { createdAt: '2026-09-01T12:00:00' }))
  assert.equal(dailyLoad(daily, '2026-10-20'), 6)
  assert.equal(bossGoal(SLOGRA, daily, '2026-10-20'), 27)
  assert.equal(bossGoal(SLOGRA, [], '2026-10-20'), 10)
  const huge = Array.from({ length: 40 }, (_, index) => chore(`g${index}`, { createdAt: '2026-09-01T12:00:00' }))
  assert.equal(bossGoal(SLOGRA, huge, '2026-10-20'), 80)
  // Las tareas de la última semana todavía no cuentan.
  assert.equal(dailyLoad([chore('n', { createdAt: '2026-10-18T12:00:00' })], '2026-10-20'), 0)
})

test('el boss de golpes se vence en cuanto el daño alcanza la meta, una sola vez', () => {
  const items = [chore('h', { difficulty: 'hard' }), chore('m', { difficulty: 'medium' })]
  const completions = [done('h', '2026-10-10'), done('m', '2026-10-10'), done('h', '2026-10-11'), done('m', '2026-10-11')]
  const state = {
    items, completions, encounters: [sloBoss('2026-10-10', { goal: 14 })], profile: profile({ level: 1 }),
  }
  assert.equal(sync(state, '2026-10-10').changed.length, 0)
  const result = sync(state, '2026-10-11', () => 0)
  const [victory] = result.encounters
  assert.equal(victory.status, 'victory')
  assert.equal(victory.resolvedOn, '2026-10-11')
  assert.deepEqual(victory.rewards.items, { postponeToken: 1, vitalityPotion: 1, holyWater: 1 })
  // 120 de EXP desde el nivel 1: sube a nivel 2 con 45 sobrantes.
  assert.deepEqual([result.profile.level, result.profile.xp], [2, 45])
  const repeated = sync({ ...state, profile: result.profile, encounters: result.encounters }, '2026-10-12')
  assert.equal(repeated.changed.length, 0)
  assert.equal(repeated.profile, result.profile)
})

test('perder contra el boss de golpes hiere 15 y aplica Lanza clavada tres días', () => {
  const state = { items: [chore('a')], encounters: [sloBoss()], profile: profile({ streakFreezes: 2 }) }
  const result = sync(state, '2026-10-15')
  const [defeat] = result.encounters
  assert.equal(defeat.status, 'defeat')
  assert.equal(defeat.curse, 'impaledSpear')
  assert.equal(result.profile.hp, 35)
  assert.equal(result.profile.streakFreezes, 2)
  assert.deepEqual(result.profile.curses.map((curse) => [curse.id, curse.startedOn, curse.expiresOn]), [
    ['impaledSpear', '2026-10-15', '2026-10-18'],
  ])
  // La maldición cobra su primer día al sincronizar de nuevo; el encuentro no cambia.
  const repeated = sync({ ...state, profile: result.profile, encounters: result.encounters }, '2026-10-15')
  assert.equal(repeated.changed.length, 0)
  assert.equal(repeated.profile.hp, 34)
  const stable = sync({ ...state, profile: repeated.profile, encounters: repeated.encounters }, '2026-10-15')
  assert.equal(stable.profile, repeated.profile)
})

test('las maldiciones se renuevan, no pasan de dos y la más cercana a caducar cede', () => {
  let curses = addCurse([], 'heaviness', 'giant-bat', '2026-10-10', 7)
  curses = addCurse(curses, 'silence', 'giant-bat', '2026-10-10', 5)
  const renewed = addCurse(curses, 'heaviness', 'giant-bat', '2026-10-12', 7)
  assert.equal(renewed.length, 2)
  assert.equal(renewed.find((curse) => curse.id === 'heaviness').expiresOn, '2026-10-19')
  assert.equal(renewed.find((curse) => curse.id === 'heaviness').startedOn, '2026-10-10')
  const replaced = addCurse(curses, 'avarice', 'giant-bat', '2026-10-11', 5)
  assert.deepEqual(replaced.map((curse) => curse.id).sort(), ['avarice', 'heaviness'])
})

test('el daño diario de una maldición se cobra una vez por día, nunca mata y caduca', () => {
  const curses = addCurse([], 'impaledSpear', 'slogra-gaibon', '2026-10-10', 3)
  const first = tickCurses(curses, 10, '2026-10-10')
  assert.equal(first.hp, 9)
  const again = tickCurses(first.curses, first.hp, '2026-10-10')
  assert.equal(again.hp, 9)
  assert.equal(again.changed, false)
  const catchUp = tickCurses(first.curses, first.hp, '2026-10-12')
  assert.equal(catchUp.hp, 7)
  const expired = tickCurses(catchUp.curses, catchUp.hp, '2026-10-13')
  assert.deepEqual(expired.curses, [])
  assert.equal(expired.hp, 7)
  const nearDeath = tickCurses(addCurse([], 'poison', 'giant-bat', '2026-10-10', 5), 1, '2026-10-14')
  assert.equal(nearDeath.hp, 1)
})

test('la sincronización cobra el daño de la maldición y la retira al caducar', () => {
  const sick = profile({ hp: 30, curses: addCurse([], 'impaledSpear', 'slogra-gaibon', '2026-10-10', 3) })
  const encounters = sync({ profile: sick }, '2026-10-10').encounters
  const noon = sync({ profile: sick, encounters }, '2026-10-12')
  assert.equal(noon.profile.hp, 27)
  const end = sync({ profile: noon.profile, encounters: noon.encounters }, '2026-10-13')
  assert.deepEqual(end.profile.curses, [])
  assert.equal(end.profile.hp, 27)
})

test('los efectos y maldiciones se combinan sobre EXP, oro, pociones y aplazamientos', () => {
  const boss = activeBoss()
  const heavy = addCurse([], 'heaviness', 'giant-bat', '2026-10-10', 7)
  assert.equal(modifyXp(10, { boss, curses: [] }, '2026-10-10'), 7)
  assert.equal(modifyXp(10, { boss, curses: heavy }, '2026-10-10'), 6)
  assert.equal(modifyXp(10, { boss: null, curses: heavy }, '2026-10-10'), 8)
  assert.equal(modifyXp(10, { boss: null, curses: heavy }, '2026-10-17'), 10)
  const greedy = addCurse([], 'avarice', 'giant-bat', '2026-10-10', 5)
  assert.equal(modifyCoins(3, { curses: greedy }, '2026-10-10'), 2)
  assert.equal(modifyCoins(1, { curses: greedy }, '2026-10-10'), 1)
  const charm = addCurse([], 'charm', 'giant-bat', '2026-10-10', 5)
  assert.equal(potionRecovery(10, { boss: sloBoss(), curses: [] }, '2026-10-10'), 5)
  assert.equal(potionRecovery(10, { boss: null, curses: [] }, '2026-10-10'), 10)
  assert.equal(potionRecovery(10, { boss: null, curses: charm }, '2026-10-10'), 0)
  const silent = addCurse([], 'silence', 'giant-bat', '2026-10-10', 5)
  assert.equal(canPostpone({ curses: silent }, '2026-10-10'), false)
  assert.equal(canPostpone({ curses: silent }, '2026-10-15'), true)
  assert.equal(cureCost(3), 60)
  assert.equal(CURSES.impaledSpear.severity, 'leve')
})

test('las tareas que cuentan para el boss dependen de su objetivo', () => {
  const day = '2026-10-10'
  const habit = chore('h', { type: 'habit', commitment: 'sideQuest' })
  const obligation = chore('o')
  assert.equal(bossCountsFor(habit, activeBoss(), day), false)
  assert.equal(bossCountsFor(obligation, activeBoss(), day), true)
  assert.equal(bossCountsFor(habit, sloBoss(), day), true)
  assert.equal(bossCountsFor(chore('n', { createdAt: '2026-10-12T12:00:00' }), sloBoss(), day), true)
  assert.equal(bossCountsFor(chore('x', { archived: true }), sloBoss(), day), false)
  assert.equal(bossCountsFor(obligation, sloBoss(), '2026-10-20'), false)
})

test('los premios antiguos de un solo recurso se migran sin perder nada', () => {
  const old = { ...activeBoss(), status: 'victory', rewardGranted: true, rewardResource: 'streakFreeze', resolvedOn: '2026-10-12' }
  const migrated = migrateEncounter(old)
  assert.deepEqual(migrated.rewards, { xp: 100, coins: 50, items: { streakFreeze: 1 } })
  assert.equal(migrateEncounter(migrated), migrated)
  const result = sync({ encounters: [old, { ...old, id: 'giant-bat:2', sequence: 2, status: 'cooldown', scheduledFor: '2099-01-01', rewardGranted: false }] }, '2026-10-20')
  assert.equal(result.changed.length, 1)
  assert.deepEqual(result.changed[0].rewards.items, { streakFreeze: 1 })
  assert.equal(result.profile.coins, 0)
})

test('el bestiario cuenta victorias y derrotas de los encuentros resueltos', () => {
  const resolved = (sequence, bossId, status, resolvedOn) => ({ ...activeBoss(), id: `enc:${sequence}`, sequence, bossId, status, resolvedOn })
  const entries = bestiaryOf([
    resolved(1, 'giant-bat', 'victory', '2026-10-12'),
    resolved(2, 'giant-bat', 'defeat', '2026-10-30'),
    resolved(3, 'giant-bat', 'victory', '2026-10-05'),
    resolved(4, 'slogra-gaibon', 'defeat', '2026-11-02'),
    { ...activeBoss(), id: 'enc:5', sequence: 5, status: 'cooldown' },
  ])
  assert.deepEqual(entries['giant-bat'], { bossId: 'giant-bat', victories: 2, defeats: 1, firstVictoryOn: '2026-10-05' })
  assert.deepEqual(entries['slogra-gaibon'], { bossId: 'slogra-gaibon', victories: 0, defeats: 1 })
})

test('cada parte del bestiario se desbloquea en sus victorias exactas', () => {
  const at = (victories) => bestiaryUnlocks(victories)
  assert.deepEqual(at(0), { page: false, odds: false, lore: false, elite: false, soul: false })
  assert.deepEqual(at(1), { page: true, odds: false, lore: false, elite: false, soul: false })
  assert.deepEqual(at(4), { page: true, odds: false, lore: false, elite: false, soul: false })
  assert.deepEqual(at(5), { page: true, odds: true, lore: false, elite: false, soul: false })
  assert.deepEqual(at(9), { page: true, odds: true, lore: false, elite: false, soul: false })
  assert.deepEqual(at(10), { page: true, odds: true, lore: true, elite: true, soul: false })
  assert.deepEqual(at(19), { page: true, odds: true, lore: true, elite: true, soul: false })
  assert.deepEqual(at(20), { page: true, odds: true, lore: true, elite: true, soul: true })
})

test('la mecánica describe el objetivo de cada boss con sus unidades', () => {
  assert.equal(
    bestiaryMechanic(BAT),
    'Completa todas tus obligaciones durante 2 días dentro de una ventana de 5 días.',
  )
  assert.equal(bestiaryMechanic(SLOGRA), 'Cada tarea cumplida le asesta un golpe, en orden: Slogra y luego Gaibon.')
})

test('el siguiente boss no repite el último y respeta el sorteo ponderado', () => {
  assert.equal(pickBoss('giant-bat', () => 0), 'slogra-gaibon')
  assert.equal(pickBoss('slogra-gaibon', () => 0.99), 'giant-bat')
  assert.deepEqual(new Set([pickBoss(undefined, () => 0), pickBoss(undefined, () => 0.99)]), new Set(['giant-bat', 'slogra-gaibon']))
})

test('un disparador reactivo se impone al sorteo al acabar el enfriamiento', () => {
  const pending = { ...activeBoss(), id: 'enc:2', sequence: 2, status: 'cooldown', scheduledFor: '2026-10-20', windowStart: undefined, windowEnd: undefined, goal: undefined }
  const calm = sync({ encounters: [pending], items: [chore('a')] }, '2026-10-20')
  assert.equal(calm.encounters[0].bossId, 'giant-bat')
  SLOGRA.trigger = () => true
  try {
    const reactive = sync({ encounters: [pending], items: [chore('a')] }, '2026-10-20')
    assert.equal(reactive.encounters[0].bossId, 'slogra-gaibon')
    assert.equal(reactive.encounters[0].goal, 10)
  } finally {
    delete SLOGRA.trigger
  }
})

test('tras renacer, con el último encuentro resuelto y sin sucesor, se programa otro', () => {
  const resolved = { ...activeBoss(), status: 'victory', rewardGranted: true, rewards: { xp: 100, coins: 50, items: {} }, resolvedOn: '2026-10-12' }
  const result = sync({ encounters: [resolved] }, '2026-11-01', () => 0)
  const next = result.encounters.find((encounter) => encounter.sequence === 2)
  assert.equal(next.status, 'scheduled')
  assert.equal(next.scheduledFor, '2026-11-11')
  assert.equal(next.bossId, 'slogra-gaibon')
  assert.equal(result.profile.coins, 0)
})

test('la derrota puede terminar la expedición en Hardcore y entonces no se sigue evaluando', () => {
  const state = { items: [chore('a')], encounters: [activeBoss()], profile: profile({ hp: 15 }) }
  const result = sync(state, '2026-10-16')
  assert.equal(result.profile.hp, 0)
  assert.equal(result.profile.dead, true)
  assert.deepEqual(result.profile.curses, [])
  const dead = sync({ ...state, profile: result.profile, encounters: result.encounters }, '2026-10-17')
  assert.equal(dead.changed.length, 0)
})

test('la derrota del boss de constancia hace 20 de daño directo y no aplica maldición', () => {
  const state = { items: [chore('a')], completions: [done('a', '2026-10-10')], encounters: [activeBoss()], profile: profile({ streakFreezes: 2 }) }
  assert.equal(sync(state, '2026-10-14').changed.length, 0)
  const result = sync(state, '2026-10-15', () => 0.9999999)
  assert.equal(result.encounters[0].status, 'defeat')
  assert.equal(result.encounters[0].resolvedOn, '2026-10-15')
  assert.equal(result.encounters[0].curse, undefined)
  assert.equal(result.profile.hp, 30)
  assert.equal(result.profile.streakFreezes, 2)
  assert.deepEqual(result.profile.curses, [])
  assert.equal(result.encounters[0].nextActivationOn, '2026-10-30')
})

test('tras una ausencia larga la ventana empieza el día en que vuelves', () => {
  const scheduled = sync({}, '2026-10-01').encounters
  const result = sync({ encounters: scheduled, items: [chore('a')] }, '2026-12-01')
  assert.equal(result.encounters[0].windowStart, '2026-12-01')
  assert.equal(result.encounters[0].status, 'active')
  assert.equal(result.profile.hp, 50)
})

test('una corrección guarda la EXP y el oro con los efectos y maldiciones de ese día', (context) => {
  context.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 9, 28, 12).getTime() })
  const yesterday = '2026-10-27'
  const items = [chore('clean', { createdAt: '2026-10-26T12:00:00' })]
  const penalties = computeMissedPenalties(items, {}, '2026-10-26', 0, { enabled: false }, yesterday)
  const base = profile({
    hp: 50 - penalties.totalDamage, runStartedAt: '2026-10-26T02:00:00', lastPenaltyCheck: yesterday,
    penaltyCheckpoint: { date: yesterday, items, freezes: 0, shieldEnabled: false },
  })
  const input = { itemId: 'clean', date: yesterday, quantity: 1 }
  const plain = planDayCorrection(input, base, items, [], penalties.missedEvents)
  assert.equal(plain.profile.xp, 10)
  const boss = activeBoss('2026-10-26')
  const reduced = planDayCorrection(input, base, items, [], penalties.missedEvents, undefined, undefined, boss)
  assert.equal(reduced.profile.xp, 7)
  assert.equal(reduced.completions[0].xpEarned, 7)
  const cursed = { ...base, curses: addCurse([], 'heaviness', 'giant-bat', '2026-10-26', 7).concat(addCurse([], 'avarice', 'giant-bat', '2026-10-26', 7)) }
  const both = planDayCorrection(input, cursed, items, [], penalties.missedEvents, undefined, undefined, boss)
  assert.equal(both.completions[0].xpEarned, 6)
  assert.equal(both.completions[0].coinsEarned, 1)
})
