import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  BOSSES,
  applyBossDamage,
  applyBossReward,
  applyBossRevenge,
  bestiaryMechanic,
  bestiaryOf,
  bestiaryUnlocks,
  bossCountsFor,
  bossGoal,
  bossXp,
  bossZones,
  chargedZoneOn,
  cerberusHeadGoals,
  cerberusProgress,
  completeDatesOf,
  dailyLoad,
  draculaProgress,
  doppelgangerProgress,
  describeEffect,
  encounterSummaryLine,
  effectPercent,
  effectPercentForItem,
  effectPercentOn,
  evaluateBossDay,
  hitProgress,
  hydraProgress,
  initialLifeStolen,
  isMedusaStatueOn,
  isBossDueOn,
  lifeProgress,
  migrateEncounter,
  pickBoss,
  pieceProgress,
  planBossSync,
  protectionsDisabledOn,
  randomInt,
  reactiveBoss,
  rewardMultiplier,
  rollDelay,
  rollRewards,
  scytheProgress,
  statueItemsOn,
  statueProgress,
  shiftKey,
  splitBars,
  summarizeBoss,
  hidesTomorrow,
  sukamonProgress,
} from '../src/lib/bosses.ts'
import { addCurse, CURSES, cureCost, tickCurses } from '../src/lib/curses.ts'
import { applyPenance, planDayCorrection } from '../src/lib/dayCorrections.ts'
import {
  canPostpone,
  freezesEnabled,
  historicalStatsVisible,
  modifyCoins,
  modifyDamage,
  modifyXp,
  potionRecovery,
} from '../src/lib/modifiers.ts'
import { computeMissedPenalties } from '../src/lib/penalties.ts'
import { defaultRoutes, effectiveMaxHp } from '../src/lib/routes.ts'
import { relicMaxHpBonus } from '../src/lib/relics.ts'
import {
  bossEntranceToken,
  hasSeenBossEntrance,
  isBossEntrancePending,
  markBossEntranceSeen,
} from '../src/lib/bossEntranceMarker.ts'
import {
  collectSoul,
  equippedSoulPassives,
  equippedSoulRank,
  hydraDawnHeal,
  isFirstZoneCompletionOn,
  soulChanceWithPity,
  soulSlotsForLevel,
  soulDefinition,
} from '../src/lib/souls.ts'
import {
  WEATHER_PROFILES,
  resetWeatherSeedForTests,
  selectWeather,
  weatherForDay,
  weatherProfile,
  weatherSeed,
} from '../src/lib/weather.ts'

beforeEach(() => {
  resetWeatherSeedForTests()
  weatherSeed({ getItem: () => 'stable-test-841', setItem: () => {} })
})

test('Hidra se activa por tres fallos recientes en una zona, incluidos los protegidos', () => {
  const trigger = BOSSES['hydra-scylla'].trigger
  const items = ['a', 'b', 'c'].map((id) => chore(id, { zone: 'Alchemy Laboratory' }))
  const base = {
    today: '2026-10-20', profile: profile(), items, completionsByItem: {}, encounters: [],
  }

  assert.equal(trigger({ ...base, events: [
    missed('a', '2026-10-11'),
    missed('b', '2026-10-12', { protectedBy: 'shield' }),
    missed('c', '2026-10-20', { protectedBy: 'soul' }),
  ] }), true)
  assert.equal(trigger({ ...base, events: [
    missed('a', '2026-10-10'),
    missed('b', '2026-10-12'),
    missed('c', '2026-10-20'),
  ] }), false)
  assert.equal(trigger({ ...base, events: [
    missed('a', '2026-10-12'),
    missed('b', '2026-10-13'),
    missed('c', '2026-10-20', { itemId: 'outside-zone' }),
  ] }), false)
})

test('Sukamon cuenta aplazamientos repetidos durante siete días y excluye lo anterior a su encuentro previo', () => {
  const postponed = (itemId, date) => ({
    id: `postponed:${itemId}:${date}`,
    itemId,
    itemTitle: itemId,
    itemType: 'chore',
    kind: 'postponed',
    scheduledDate: date,
    activityDate: date,
    occurredAt: `${date}T12:00:00.000Z`,
    runStartedAt: '2026-10-01T02:00:00',
  })
  const items = [chore('a'), chore('b')]
  const events = [
    postponed('a', '2026-10-10'),
    postponed('a', '2026-10-11'),
    postponed('b', '2026-10-16'),
    postponed('b', '2026-10-09'),
  ]
  const context = {
    today: '2026-10-16',
    profile: profile(),
    items,
    completionsByItem: byItem([done('b', '2026-10-16')]),
    encounters: [],
    events,
  }

  assert.equal(reactiveBoss(context), 'sukamon')
  assert.equal(BOSSES.sukamon.trigger(context), true)
  assert.equal(BOSSES.sukamon.trigger({
    ...context,
    encounters: [{
      id: 'sukamon:previous',
      bossId: 'sukamon',
      sequence: 1,
      status: 'victory',
      scheduledFor: '2026-10-10',
      resolvedOn: '2026-10-10',
      rewardGranted: true,
      damageApplied: false,
      createdAt: '2026-10-10T00:00:00.000Z',
    }],
  }), false)

  const scheduled = {
    ...sukamonBoss('2026-10-16'),
    id: 'enc:scheduled',
    bossId: 'giant-bat',
    status: 'cooldown',
    targetItemIds: undefined,
  }
  const activated = planBossSync({
    ...context,
    completionsByItem: {},
    encounters: [scheduled],
    random: () => 0.5,
  })
  const active = activated.encounters.find((record) => record.id === scheduled.id)
  assert.equal(active.bossId, 'sukamon')
  assert.deepEqual(active.targetItemIds, ['a', 'b'])
})

test('Sukamon fija objetivos al aparecer y exige completar la meta cuantitativa ese mismo día', () => {
  const encounter = sukamonBoss('2026-10-16', { targetItemIds: ['a', 'b'] })
  const items = [
    chore('a', { trackingType: 'quantity', quantityGoal: 5 }),
    chore('b', { trackingType: 'quantity', quantityGoal: 3 }),
  ]
  const partial = sukamonProgress(encounter, items, byItem([
    done('a', '2026-10-16', { quantityDone: 5 }),
    done('b', '2026-10-16', { quantityDone: 2 }),
  ]))
  assert.deepEqual(partial.completedItemIds, ['a'])
  assert.equal(partial.won, false)

  const complete = sukamonProgress(encounter, items, byItem([
    done('a', '2026-10-16', { quantityDone: 5 }),
    done('b', '2026-10-16', { quantityDone: 3 }),
  ]))
  assert.equal(complete.won, true)
  assert.equal(complete.resolvedOn, '2026-10-16')
})

test('Sukamon no tiene consumibles de consuelo y el Digivice solo puede salir una vez por expedición', () => {
  const items = [chore('a')]
  const encounter = sukamonBoss('2026-10-16', { targetItemIds: ['a'] })
  const won = planBossSync({
    today: '2026-10-16',
    profile: profile(),
    items,
    completionsByItem: byItem([done('a', '2026-10-16')]),
    encounters: [encounter],
    random: () => 0.029,
  })
  const victory = won.encounters.find((record) => record.id === encounter.id)
  assert.equal(victory.status, 'victory')
  assert.equal(victory.rewards.digivice, true)
  assert.deepEqual(victory.rewards.items, {})
  assert.equal(victory.rewards.souls, undefined)
  assert.equal(won.profile.digivice, true)

  const boundary = planBossSync({
    today: '2026-10-16',
    profile: profile(),
    items,
    completionsByItem: byItem([done('a', '2026-10-16')]),
    encounters: [sukamonBoss('2026-10-16', { targetItemIds: ['a'] })],
    random: () => 0.03,
  })
  const boundaryVictory = boundary.encounters.find((record) => record.id === encounter.id)
  assert.equal(boundaryVictory.rewards.digivice, undefined)
  assert.deepEqual(boundaryVictory.rewards.items, {})

  const alreadyOwned = planBossSync({
    today: '2026-10-16',
    profile: profile({ digivice: true }),
    items,
    completionsByItem: byItem([done('a', '2026-10-16')]),
    encounters: [sukamonBoss('2026-10-16', { targetItemIds: ['a'] })],
    random: () => 0,
  })
  const secondVictory = alreadyOwned.encounters.find((record) => record.id === encounter.id)
  assert.equal(secondVictory.rewards.digivice, undefined)
})

test('perder contra Sukamon no causa daño y quita como máximo un sello', () => {
  const encounter = sukamonBoss('2026-10-16', { targetItemIds: ['a'] })
  const result = planBossSync({
    today: '2026-10-17',
    profile: profile({ postponeTokens: 0 }),
    items: [chore('a')],
    completionsByItem: {},
    encounters: [encounter],
    random: () => 0.5,
  })
  const defeat = result.encounters.find((record) => record.id === encounter.id)
  assert.equal(defeat.status, 'defeat')
  assert.equal(result.profile.postponeTokens, 0)
  assert.equal(result.profile.hp, 50)
  assert.equal(defeat.resolvedOn, '2026-10-17')

  const withToken = planBossSync({
    today: '2026-10-17',
    profile: profile({ postponeTokens: 2 }),
    items: [chore('a')],
    completionsByItem: {},
    encounters: [sukamonBoss('2026-10-16', { targetItemIds: ['a'] })],
    random: () => 0.5,
  })
  assert.equal(withToken.profile.postponeTokens, 1)
})

test('Drácula mantiene Noche eterna, daño de fallo ×1,5 y el eclipse ×2', () => {
  const eclipseDate = Array.from({ length: 400 }, (_, offset) => shiftKey('2026-10-01', offset))
    .find((date) => weatherForDay(date) === 'eclipse')
  const clearDate = Array.from({ length: 400 }, (_, offset) => shiftKey('2026-10-01', offset))
    .find((date) => weatherForDay(date) !== 'eclipse')
  assert.ok(eclipseDate)
  assert.ok(clearDate)

  const eclipseBoss = draculaBoss(eclipseDate)
  const clearBoss = draculaBoss(clearDate)
  assert.equal(BOSSES.dracula.objective.kind, 'dracula')
  assert.equal(BOSSES.dracula.windowDays, 12)
  assert.equal(BOSSES.dracula.weight, 0)
  assert.equal(BOSSES.dracula.soulChance, 0.02)
  assert.equal(BOSSES.dracula.drops.length, 0)
  assert.equal(bossGoal(BOSSES.dracula, [], eclipseDate), 10)
  assert.equal(effectPercent(eclipseBoss, 'damagePercent', eclipseDate), 150)
  assert.equal(modifyDamage(10, { boss: eclipseBoss }, eclipseDate), 30)
  assert.equal(modifyDamage(10, { boss: clearBoss }, clearDate), 15)
  assert.equal(soulDefinition('dracula').passiveId, undefined)
  assert.match(soulDefinition('dracula').effectDescription, /sin pasiva/i)
})

test('Drácula recorre Humano, Murciélago y Demonio, empezando cada fase al día siguiente', () => {
  const encounter = draculaBoss()
  const human = chore('human')
  const hardA = chore('hard-a', { difficulty: 'hard', createdAt: '2026-10-13T10:00:00' })
  const hardB = chore('hard-b', { difficulty: 'hard', createdAt: '2026-10-13T10:00:00' })
  const items = [human, hardA, hardB]
  const completions = byItem([
    done('human', '2026-10-10'),
    done('human', '2026-10-12'),
    done('hard-a', '2026-10-13'),
    done('hard-b', '2026-10-13'),
  ])

  const bat = draculaProgress(encounter, items, completions, [], '2026-10-12')
  assert.equal(bat.phase, 'bat')
  assert.equal(bat.phaseStartedOn, '2026-10-13')
  assert.equal(bat.phaseEndsOn, '2026-10-16')
  assert.deepEqual(bat.completedPhases, ['human'])
  assert.equal(bat.progress, 0)

  const legacyGoal = draculaProgress(
    { ...encounter, draculaBatGoal: undefined, draculaDemonGoal: 12 },
    items,
    completions,
    [],
    '2026-10-12',
  )
  assert.equal(legacyGoal.goal, 12)

  const demon = draculaProgress(encounter, items, completions, [], '2026-10-13')
  assert.equal(demon.phase, 'demon')
  assert.equal(demon.phaseStartedOn, '2026-10-14')
  assert.equal(demon.phaseEndsOn, '2026-10-17')
  assert.deepEqual(demon.completedPhases, ['human', 'bat'])
  assert.equal(demon.progress, 0)

  const victory = draculaProgress(encounter, items, completions, [], '2026-10-18')
  assert.equal(victory.verdict.won, true)
  assert.equal(victory.verdict.resolvedOn, '2026-10-17')
  assert.deepEqual(victory.completedPhases, ['human', 'bat', 'demon'])

  const protectedMiss = missed('human', '2026-10-15', { protectedBy: 'shield' })
  const defeat = draculaProgress(encounter, items, completions, [protectedMiss], '2026-10-18')
  assert.equal(defeat.missed, true)
  assert.deepEqual(defeat.verdict, { won: false, lost: true, resolvedOn: '2026-10-18' })

  const excludedMisses = [
    missed('habit', '2026-10-15', { itemType: 'habit' }),
    missed('side-quest', '2026-10-16', { commitment: 'sideQuest' }),
  ]
  const clean = draculaProgress(encounter, items, completions, excludedMisses, '2026-10-18')
  assert.equal(clean.verdict.won, true)
})

test('Drácula pierde al cerrar la cuarta jornada fallida y aplica la Marca hasta la revancha', () => {
  const completedRoutes = Object.fromEntries(
    Object.keys(defaultRoutes()).map((routeId) => [routeId, { level: 5 }]),
  )
  const player = profile({
    level: 30,
    routes: completedRoutes,
    draculaMilestones: allDraculaMilestones(),
  })
  const result = planBossSync({
    today: '2026-10-14',
    profile: player,
    items: [],
    completionsByItem: {},
    encounters: [draculaBoss()],
    random: () => 0,
  })
  const defeat = result.encounters.find((encounter) => encounter.id === 'enc:dracula')
  assert.equal(defeat.status, 'defeat')
  assert.equal(defeat.resolvedOn, '2026-10-14')
  assert.equal(result.profile.hp, 45)
  assert.equal(effectiveMaxHp(result.profile), 45)
  assert.equal(result.profile.curses[0].id, 'draculaMark')
  assert.equal(result.profile.curses[0].permanent, true)
  assert.equal(result.profile.draculaRevengeOn, '2026-10-24')

  const beforeRevenge = planBossSync({
    today: '2026-10-23',
    profile: result.profile,
    items: [],
    completionsByItem: {},
    encounters: result.encounters,
    random: () => 0,
  })
  assert.equal(beforeRevenge.encounters.at(-1).status, 'cooldown')
  const revenge = planBossSync({
    today: '2026-10-24',
    profile: beforeRevenge.profile,
    items: [],
    completionsByItem: {},
    encounters: beforeRevenge.encounters,
    random: () => 0,
  })
  assert.equal(revenge.encounters.at(-1).bossId, 'dracula')
  assert.equal(revenge.encounters.at(-1).status, 'active')
  assert.equal(revenge.profile.curses[0].id, 'draculaMark')
  assert.equal(revenge.profile.draculaRevengeOn, undefined)
})

test('Drácula agrupa hitos de nivel y espera a que termine el boss activo', () => {
  const task = chore('a')
  const active = activeBoss()
  const queued = planBossSync({
    today: '2026-10-10',
    profile: profile({ level: 30, draculaMilestones: [] }),
    items: [task],
    completionsByItem: {},
    encounters: [active],
    random: () => 0.5,
  })
  assert.equal(queued.profile.draculaPending, true)
  assert.deepEqual(queued.profile.draculaMilestones, ['level:10', 'level:20', 'level:30'])
  assert.equal(queued.encounters.at(-1).bossId, 'giant-bat')
  assert.equal(queued.encounters.at(-1).status, 'active')

  const activated = planBossSync({
    today: '2026-10-11',
    profile: queued.profile,
    items: [task],
    completionsByItem: byItem([done('a', '2026-10-10'), done('a', '2026-10-11')]),
    encounters: queued.encounters,
    random: () => 0.5,
  })
  const dracula = activated.encounters.find((encounter) => encounter.bossId === 'dracula')
  assert.equal(dracula.status, 'active')
  assert.equal(dracula.windowStart, '2026-10-11')
  assert.equal(activated.profile.draculaPending, false)
  assert.equal(activated.encounters.filter((encounter) => encounter.bossId === 'dracula').length, 1)

  const routeProfile = profile({
    draculaMilestones: [],
    routes: { ...defaultRoutes(), technomancer: { level: 5 } },
  })
  const routeTrigger = sync({ profile: routeProfile }, '2026-10-10')
  assert.equal(routeTrigger.encounters.at(-1).bossId, 'dracula')
  assert.ok(routeTrigger.profile.draculaMilestones.includes('route:technomancer'))
})

test('la victoria de Drácula elimina la Marca y concede una sola Corona permanente', () => {
  const items = [
    chore('human'),
    chore('hard-a', { difficulty: 'hard', createdAt: '2026-10-13T10:00:00' }),
    chore('hard-b', { difficulty: 'hard', createdAt: '2026-10-13T10:00:00' }),
  ]
  const completions = byItem([
    done('human', '2026-10-10'),
    done('human', '2026-10-12'),
    done('hard-a', '2026-10-13'),
    done('hard-b', '2026-10-13'),
  ])
  const marked = addCurse([], 'draculaMark', 'dracula', '2026-10-14', 0, true)
  const result = planBossSync({
    today: '2026-10-18',
    profile: profile({ curses: marked, hp: 40 }),
    items,
    completionsByItem: completions,
    encounters: [draculaBoss()],
    random: () => 0.005,
  })
  const victory = result.encounters.find((encounter) => encounter.id === 'enc:dracula')
  assert.equal(victory.status, 'victory')
  assert.equal(victory.rewards.xp, 400)
  assert.equal(victory.rewards.coins, 200)
  assert.deepEqual(victory.rewards.items, {})
  assert.deepEqual(victory.rewards.cosmetics, ['nightCrown'])
  assert.ok(victory.rewards.souls.dracula)
  assert.deepEqual(result.profile.unlockedCosmetics, ['nightCrown'])
  assert.equal(result.profile.curses.some((curse) => curse.id === 'draculaMark'), false)
  assert.equal(effectiveMaxHp(result.profile), result.profile.maxHp)
  assert.ok(effectiveMaxHp(result.profile) > 45)

  const repeated = planBossSync({
    today: '2026-10-18',
    profile: profile({ unlockedCosmetics: ['nightCrown'] }),
    items,
    completionsByItem: completions,
    encounters: [draculaBoss('2026-10-10', { id: 'enc:dracula:2', sequence: 2 })],
    random: () => 0.5,
  })
  const repeatedVictory = repeated.encounters.find((encounter) => encounter.id === 'enc:dracula:2')
  assert.equal(repeatedVictory.rewards.cosmetics, undefined)
  assert.deepEqual(repeated.profile.unlockedCosmetics, ['nightCrown'])
})

test('Doppelgänger compara cinco días, incluye fallos protegidos y espera al cierre', () => {
  const encounter = doppelgangerBoss()
  const tasks = [chore('a'), chore('b'), chore('c')]
  const completions = []
  for (let day = 5; day <= 9; day += 1) {
    const date = `2026-10-${String(day).padStart(2, '0')}`
    completions.push(done('a', date), done('b', date))
  }
  for (let day = 10; day <= 14; day += 1) {
    const date = `2026-10-${String(day).padStart(2, '0')}`
    completions.push(done('a', date), done('b', date))
  }
  completions.push(done('c', '2026-10-14'))
  const events = [
    missed('a', '2026-10-08', { protectedBy: 'shield' }),
    missed('b', '2026-10-13', { protectedBy: 'soul' }),
  ]

  const beforeClose = doppelgangerProgress(
    encounter, tasks, byItem(completions), events, '2026-10-14',
  )
  assert.deepEqual(beforeClose, {
    previousCompletions: 10,
    currentCompletions: 11,
    targetCompletions: 11,
    previousMisses: 1,
    currentMisses: 1,
    won: false,
  })
  const closed = doppelgangerProgress(
    encounter, tasks, byItem(completions), events, '2026-10-15',
  )
  assert.equal(closed.won, true)
  assert.equal(closed.resolvedOn, '2026-10-14')

  const tooManyMisses = doppelgangerProgress(
    encounter, tasks, byItem(completions), [...events, missed('c', '2026-10-14')],
    '2026-10-15',
  )
  assert.equal(tooManyMisses.won, false)
})

test('Doppelgänger requiere un completado si el periodo base fue cero y omite cantidades incompletas', () => {
  const encounter = doppelgangerBoss()
  const task = chore('quantity', { trackingType: 'quantity', quantityGoal: 5 })
  const incomplete = byItem([done('quantity', '2026-10-10', { quantityDone: 2 })])
  const noWin = doppelgangerProgress(encounter, [task], incomplete, [], '2026-10-15')
  assert.equal(noWin.targetCompletions, 1)
  assert.equal(noWin.currentCompletions, 0)
  assert.equal(noWin.won, false)

  const met = byItem([done('quantity', '2026-10-10', { quantityDone: 5 })])
  assert.equal(doppelgangerProgress(encounter, [task], met, [], '2026-10-15').won, true)
})

test('Doppelgänger prioriza el avance de ruta o el ritmo estable de 30 días', () => {
  const trigger = BOSSES.doppelganger.trigger
  const base = {
    today: '2026-10-30',
    profile: profile(),
    items: [],
    completionsByItem: {},
    encounters: [],
  }
  const routeProfile = profile({
    routes: {
      ...defaultRoutes(),
      'vampire-hunter': { level: 1, startedOn: '2026-10-01', windowStart: '2026-10-21' },
    },
  })
  assert.equal(trigger({ ...base, profile: routeProfile }), true)
  assert.equal(trigger({
    ...base,
    profile: routeProfile,
    encounters: [{ bossId: 'doppelganger', status: 'victory', resolvedOn: '2026-10-20' }],
  }), false)

  const task = chore('steady')
  const completions = []
  for (let day = 1; day <= 7; day += 1) completions.push(done('steady', `2026-10-0${day}`))
  for (let day = 24; day <= 30; day += 1) completions.push(done('steady', `2026-10-${day}`))
  assert.equal(trigger({
    ...base, items: [task], completionsByItem: byItem(completions),
  }), true)
  assert.equal(trigger({
    ...base,
    items: [task],
    completionsByItem: byItem(completions.filter((completion) => completion.date !== '2026-10-30')),
  }), false)
})

test('Doppelgänger resuelve el duelo al cerrar y concede el Espejo o Sombra', () => {
  const encounter = doppelgangerBoss()
  const tasks = [chore('a'), chore('b'), chore('c')]
  const completions = []
  for (let day = 5; day <= 9; day += 1) {
    const date = `2026-10-${String(day).padStart(2, '0')}`
    completions.push(done('a', date), done('b', date))
  }
  for (let day = 10; day <= 14; day += 1) {
    const date = `2026-10-${String(day).padStart(2, '0')}`
    completions.push(done('a', date), done('b', date))
  }
  completions.push(done('c', '2026-10-14'))

  const victory = planBossSync({
    today: '2026-10-15', profile: profile(), items: tasks,
    completionsByItem: byItem(completions), encounters: [encounter], random: () => 0.99,
  })
  assert.equal(victory.encounters.find((entry) => entry.id === encounter.id)?.status, 'victory')
  assert.ok(victory.profile.relics.includes('silverMirror'))

  const defeat = planBossSync({
    today: '2026-10-15', profile: profile(), items: tasks,
    completionsByItem: {}, encounters: [encounter], random: () => 0.99,
  })
  assert.equal(defeat.encounters.find((entry) => entry.id === encounter.id)?.status, 'defeat')
  assert.ok(defeat.profile.curses.some((curse) => curse.id === 'shadow'))
})

test('Hidra corta cabezas por completados y solo las obligaciones fallidas las hacen crecer al cierre', () => {
  const encounter = hydraBoss()
  const tasks = [chore('a'), chore('b'), chore('c')]
  const completed = byItem(tasks.map((item) => done(item.id, '2026-10-10')))

  const beforeClose = hydraProgress(encounter, tasks, completed, [], '2026-10-10')
  assert.deepEqual(beforeClose, { heads: 0, cut: 3, grown: 0, reachedOn: undefined })

  const protectedMiss = missed('a', '2026-10-10', { protectedBy: 'freeze' })
  const closed = hydraProgress(encounter, tasks, completed, [protectedMiss], '2026-10-11')
  assert.deepEqual(closed, { heads: 1, cut: 3, grown: 1, reachedOn: undefined })

  const victory = hydraProgress(encounter, tasks, completed, [], '2026-10-11')
  assert.deepEqual(victory, { heads: 0, cut: 3, grown: 0, reachedOn: '2026-10-10' })
})

test('Hidra confirma la victoria al día siguiente del cierre y aplica Veneno de hidra al perder', () => {
  const encounter = hydraBoss()
  const tasks = [chore('a'), chore('b'), chore('c')]
  const completionsByItem = byItem(tasks.map((item) => done(item.id, '2026-10-10')))
  const stillActive = planBossSync({
    today: '2026-10-10', profile: profile(), items: tasks, completionsByItem, encounters: [encounter],
    random: () => 0,
  })
  assert.equal(stillActive.encounters.find((entry) => entry.id === encounter.id)?.status, 'active')

  const victory = planBossSync({
    today: '2026-10-11', profile: profile(), items: tasks, completionsByItem, encounters: [encounter],
    random: () => 0,
  })
  assert.equal(victory.encounters.find((entry) => entry.id === encounter.id)?.status, 'victory')
  assert.equal(victory.encounters.find((entry) => entry.id === encounter.id)?.resolvedOn, '2026-10-10')

  const defeat = planBossSync({
    today: '2026-10-15', profile: profile(), items: [], completionsByItem: {}, encounters: [encounter],
    random: () => 0,
  })
  assert.equal(defeat.encounters.find((entry) => entry.id === encounter.id)?.status, 'defeat')
  assert.equal(defeat.profile.curses[0].id, 'hydraPoison')
  assert.equal(CURSES.hydraPoison.drainPerDay, 1)
  assert.match(CURSES.hydraPoison.description, /poción de vigor/i)
  assert.equal(potionRecovery(10, { boss: hydraBoss(), curses: [] }, '2026-10-10'), 5)
  const poison = addCurse([], 'hydraPoison', 'hydra-scylla', '2026-10-10', 5)
  assert.equal(tickCurses(poison, 10, '2026-10-10').hp, 9)
})

test('el alma de Hidra cura 2/4/6 PV al amanecer solo tras un día sin fallos', () => {
  const runStartedAt = '2026-10-01T02:00:00'
  const soulProfile = profile({
    hp: 10,
    souls: { 'hydra-scylla': { rank: 2, fragments: 0 } },
    dailySoulLoadout: { date: '2026-10-10', souls: ['hydra-scylla'] },
  })
  const daySnapshots = [{
    date: '2026-10-10', runStartedAt, level: 1, xp: 0, hp: 10, maxHp: 50,
    soulLoadout: ['hydra-scylla'], soulRanks: { 'hydra-scylla': 2 },
  }]
  const healed = planBossSync({
    today: '2026-10-11', profile: soulProfile, items: [], completionsByItem: {}, encounters: [],
    events: [], daySnapshots, random: () => 0,
  })
  assert.equal(hydraDawnHeal(1), 2)
  assert.equal(hydraDawnHeal(2), 4)
  assert.equal(hydraDawnHeal(3), 6)
  assert.equal(healed.profile.hp, 14)
  assert.equal(healed.dailyPassiveActivations[0].passiveId, 'hydraDawnHeal')
  const retried = planBossSync({
    today: '2026-10-11', profile: healed.profile, items: [], completionsByItem: {},
    encounters: healed.encounters, events: [], daySnapshots,
    soulPassiveActivations: healed.dailyPassiveActivations, random: () => 0,
  })
  assert.equal(retried.profile.hp, 14)
  assert.equal(retried.dailyPassiveActivations.length, 0)

  const failed = planBossSync({
    today: '2026-10-11', profile: soulProfile, items: [], completionsByItem: {}, encounters: [],
    events: [missed('old-task', '2026-10-10', { protectedBy: 'shield' })],
    daySnapshots, random: () => 0,
  })
  assert.equal(failed.profile.hp, 10)
  assert.equal(failed.dailyPassiveActivations.length, 0)
})

const BAT = BOSSES['giant-bat']
const SLOGRA = BOSSES['slogra-gaibon']
const LEGION = BOSSES.legion
const FRANKENSTEIN = BOSSES.frankenstein
const SUCCUBUS = BOSSES.succubus
const DEATH = BOSSES.death
const MEDUSA = BOSSES.medusa

test('la entrada cinematográfica de un boss usa un marcador local idempotente y limitado', () => {
  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  const encounter = { id: 'enc:1', createdAt: '2026-10-30T12:00:00.000Z' }
  const token = bossEntranceToken(encounter)

  assert.equal(isBossEntrancePending({ ...encounter, status: 'scheduled' }, storage), false)
  assert.equal(isBossEntrancePending({ ...encounter, status: 'active' }, storage), true)
  assert.equal(hasSeenBossEntrance(token, storage), false)
  markBossEntranceSeen(token, storage)
  markBossEntranceSeen(token, storage)
  assert.equal(hasSeenBossEntrance(token, storage), true)
  assert.equal(isBossEntrancePending({ ...encounter, status: 'victory' }, storage), false)

  for (let index = 2; index <= 35; index += 1) {
    markBossEntranceSeen(`enc:${index}:created:active`, storage)
  }
  const stored = JSON.parse(values.get('habitos.boss.entrance.seen'))
  assert.equal(stored.length, 30)
  assert.equal(stored.includes(token), false)
  assert.equal(hasSeenBossEntrance(token, null), false)
})

test('Cerbero fija metas por carga real de cada categoría al aparecer', () => {
  const obligation = chore('obligation')
  const scroll = chore('scroll', {
    type: 'todo',
    startDate: '2026-10-01',
    dueDate: '2026-10-20',
  })
  const sideQuest = chore('side-quest', { commitment: 'sideQuest' })

  assert.deepEqual(
    cerberusHeadGoals([obligation, scroll, sideQuest], '2026-10-20'),
    { obligations: 5, scrolls: 5, sideQuests: 5 },
  )
})

test('Cerbero solo se activa si hubo una misión secundaria disponible durante la semana', () => {
  const trigger = BOSSES.cerberus.trigger
  const base = { today: '2026-10-20', profile: profile(), completionsByItem: {}, encounters: [] }

  assert.equal(trigger({ ...base, items: [] }), false)
  assert.equal(trigger({
    ...base,
    items: [chore('new-side-quest', { commitment: 'sideQuest', createdAt: '2026-10-19T12:00:00' })],
  }), false)
  assert.equal(trigger({
    ...base,
    items: [chore('side-quest', { commitment: 'sideQuest' })],
  }), true)
  assert.equal(trigger({
    ...base,
    items: [chore('side-quest', { commitment: 'sideQuest' })],
    completionsByItem: { 'side-quest': [done('side-quest', '2026-10-19')] },
  }), false)
})

test('Cerbero resalta tareas debidas de sus tres categorías, pero no hábitos', () => {
  const encounter = {
    ...activeBoss('2026-10-10'),
    id: 'enc:cerberus',
    bossId: 'cerberus',
    windowEnd: '2026-10-14',
    headGoals: { obligations: 1, scrolls: 1, sideQuests: 1 },
  }
  const items = [
    chore('obligation'),
    chore('scroll', { type: 'todo', startDate: '2026-10-01', dueDate: '2026-10-20' }),
    chore('side-quest', { commitment: 'sideQuest' }),
  ]
  const summary = summarizeBoss(encounter, items, {}, '2026-10-10')

  assert.deepEqual(items.map((item) => bossCountsFor(item, encounter, '2026-10-10')), [true, true, true])
  assert.equal(bossCountsFor(chore('habit', { type: 'habit' }), encounter, '2026-10-10'), false)
  assert.equal(summary.bars.length, 3)
  assert.equal(encounterSummaryLine(summary), '0/3 cabezas derrotadas')
})

test('Cerbero cuenta una vez por tarea y regenera cada cabeza sin progreso de su categoría', () => {
  const obligation = chore('obligation')
  const scroll = chore('scroll', {
    type: 'todo',
    startDate: '2026-10-01',
    dueDate: '2026-10-20',
  })
  const sideQuest = chore('side-quest', { commitment: 'sideQuest' })
  const encounter = {
    ...activeBoss('2026-10-10'),
    id: 'enc:cerberus',
    bossId: 'cerberus',
    windowEnd: '2026-10-14',
    goal: 6,
    headGoals: { obligations: 2, scrolls: 2, sideQuests: 2 },
  }
  const progress = cerberusProgress(encounter, [obligation, scroll, sideQuest], {
    obligation: [done('obligation', '2026-10-10'), done('obligation', '2026-10-10')],
    scroll: [done('scroll', '2026-10-10')],
    'side-quest': [done('side-quest', '2026-10-10'), done('side-quest', '2026-10-11')],
  }, '2026-10-11')

  assert.equal(progress.headsDown, 1)
  assert.deepEqual(progress.bars.map(({ hp }) => hp), [2, 2, 0])
  assert.equal(progress.goal, 6)
})

test('Cerbero solo vence cuando las tres cabezas caen el mismo día', () => {
  const items = [
    chore('obligation'),
    chore('scroll', { type: 'todo', startDate: '2026-10-01', dueDate: '2026-10-20' }),
    chore('side-quest', { commitment: 'sideQuest' }),
  ]
  const encounter = {
    ...activeBoss('2026-10-10'),
    id: 'enc:cerberus',
    bossId: 'cerberus',
    windowEnd: '2026-10-14',
    goal: 3,
    headGoals: { obligations: 1, scrolls: 1, sideQuests: 1 },
  }
  const staggered = {
    obligation: [done('obligation', '2026-10-10')],
    scroll: [done('scroll', '2026-10-11')],
    'side-quest': [done('side-quest', '2026-10-11')],
  }
  assert.equal(cerberusProgress(encounter, items, staggered, '2026-10-11').reachedOn, undefined)

  const together = Object.fromEntries(items.map((item) => [item.id, [done(item.id, '2026-10-10')]]))
  const result = planBossSync({
    today: '2026-10-10',
    profile: profile(),
    items,
    completionsByItem: together,
    encounters: [encounter],
    random: () => 0,
  })
  assert.equal(result.encounters.find((candidate) => candidate.id === encounter.id)?.status, 'victory')
  assert.equal(result.encounters.find((candidate) => candidate.id === encounter.id)?.resolvedOn, '2026-10-10')
})

test('Cerbero aplica Triple mordisco cuando acaba el plazo sin derribar las tres cabezas', () => {
  const encounter = {
    ...activeBoss('2026-10-10'),
    id: 'enc:cerberus',
    bossId: 'cerberus',
    windowEnd: '2026-10-14',
    goal: 3,
    headGoals: { obligations: 1, scrolls: 1, sideQuests: 1 },
  }
  const result = planBossSync({
    today: '2026-10-15',
    profile: profile(),
    items: [],
    completionsByItem: {},
    encounters: [encounter],
    random: () => 0,
  })

  assert.equal(result.encounters.find((candidate) => candidate.id === encounter.id)?.status, 'defeat')
  assert.ok(result.profile.curses.some((curse) => curse.id === 'tripleBite'))
})

test('la pasiva de Cerbero reduce daño según rango sin apagar el efecto de entorno', () => {
  const date = '2026-10-10'
  const damageForRank = (rank) => modifyDamage(100, {
    soulProfile: profile({
      souls: { cerberus: { rank, fragments: 0 } },
      equippedSouls: ['cerberus'],
      dailySoulLoadout: { date, souls: ['cerberus'] },
    }),
    soulDate: date,
  }, date)
  const environmentDamage = modifyDamage(100, {
    boss: { ...activeBoss(date), bossId: 'cerberus' },
  }, date)

  assert.ok(damageForRank(1) < environmentDamage)
  assert.ok(damageForRank(2) < damageForRank(1))
  assert.ok(damageForRank(3) < damageForRank(2))
})

function chore(id, changes = {}) {
  return {
    id, title: id, type: 'chore', difficulty: 'easy', trackingType: 'boolean',
    archived: false, createdAt: '2026-10-01T12:00:00', ...changes,
  }
}

function hydraBoss(windowStart = '2026-10-10', changes = {}) {
  return {
    id: 'enc:hydra', bossId: 'hydra-scylla', sequence: 1, status: 'active', scheduledFor: windowStart,
    windowStart, windowEnd: shiftKey(windowStart, 4), goal: 3,
    rewardGranted: false, damageApplied: false, createdAt: '2026-10-01T00:00:00.000Z', ...changes,
  }
}

function doppelgangerBoss(windowStart = '2026-10-10', changes = {}) {
  return {
    id: 'enc:doppelganger', bossId: 'doppelganger', sequence: 1, status: 'active', scheduledFor: windowStart,
    windowStart, windowEnd: shiftKey(windowStart, 4), goal: 0,
    rewardGranted: false, damageApplied: false, createdAt: '2026-10-01T00:00:00.000Z', ...changes,
  }
}

function sukamonBoss(windowStart = '2026-10-10', changes = {}) {
  return {
    id: 'enc:sukamon', bossId: 'sukamon', sequence: 1, status: 'active', scheduledFor: windowStart,
    windowStart, windowEnd: windowStart, goal: 0, targetItemIds: ['a'],
    rewardGranted: false, damageApplied: false, createdAt: '2026-10-01T00:00:00.000Z', ...changes,
  }
}

function draculaBoss(windowStart = '2026-10-10', changes = {}) {
  return {
    id: 'enc:dracula', bossId: 'dracula', sequence: 1, status: 'active', scheduledFor: windowStart,
    windowStart, windowEnd: shiftKey(windowStart, 11), goal: 2,
    draculaPhase: 'human', draculaPhaseStartedOn: windowStart,
    draculaPhaseEndsOn: shiftKey(windowStart, 3), draculaBatGoal: 10, draculaPhasesCompleted: [],
    rewardGranted: false, damageApplied: false, createdAt: '2026-10-01T00:00:00.000Z', ...changes,
  }
}

function allDraculaMilestones() {
  return [
    'level:10', 'level:20', 'level:30',
    ...Object.keys(defaultRoutes()).map((routeId) => `route:${routeId}`),
  ]
}

function missed(itemId, date, changes = {}) {
  return {
    id: `missed:${itemId}:${date}`, itemId, itemTitle: itemId, itemType: 'chore',
    kind: 'missed', scheduledDate: date, activityDate: date, occurredAt: `${date}T02:00:00.000Z`,
    runStartedAt: '2026-10-01T02:00:00', ...changes,
  }
}

function done(itemId, date, changes = {}) {
  return { id: `${itemId}:${date}`, itemId, date, xpEarned: 10, coinsEarned: 2, createdAt: `${date}T12:00:00`, ...changes }
}

function zoneTodo(id, zone, dueDate = '2026-10-10') {
  return chore(id, { type: 'todo', zone, dueDate })
}

function byItem(completions) {
  return Object.groupBy(completions, (completion) => completion.itemId)
}

function profile(changes = {}) {
  return {
    id: 1, level: 1, xp: 0, coins: 0, postponeTokens: 0, vitalityPotions: 0, hp: 50, maxHp: 50,
    streakFreezes: 0, holyWater: 0, curses: [], routes: defaultRoutes(), equippedRoute: null,
    souls: {}, soulPity: {}, relics: [], equippedSouls: [],
    draculaMilestones: ['level:10'],
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

function legionBoss(windowStart = '2026-10-10', changes = {}) {
  return activeBoss(windowStart, { id: 'enc:1', bossId: 'legion', goal: 8, windowEnd: shiftKey(windowStart, 2), ...changes })
}

function frankensteinBoss(windowStart = '2026-10-10', changes = {}) {
  return {
    id: 'enc:1', bossId: 'frankenstein', sequence: 1, status: 'active', scheduledFor: windowStart,
    windowStart, windowEnd: shiftKey(windowStart, 4), goal: 3, zones: ['A', 'B', 'C'],
    rewardGranted: false, damageApplied: false, createdAt: '2026-10-01T00:00:00.000Z', ...changes,
  }
}

function succubusBoss(windowStart = '2026-10-10', changes = {}) {
  return {
    id: 'enc:1', bossId: 'succubus', sequence: 1, status: 'active', scheduledFor: windowStart,
    windowStart, windowEnd: shiftKey(windowStart, 4), goal: 10,
    rewardGranted: false, damageApplied: false, createdAt: '2026-10-01T00:00:00.000Z', ...changes,
  }
}

function deathBoss(windowStart = '2026-10-10', changes = {}) {
  return {
    id: 'enc:1', bossId: 'death', sequence: 1, status: 'active', scheduledFor: windowStart,
    windowStart, windowEnd: shiftKey(windowStart, 4), goal: 5,
    rewardGranted: false, damageApplied: false, createdAt: '2026-10-01T00:00:00.000Z', ...changes,
  }
}

function medusaBoss(windowStart = '2026-10-10', changes = {}) {
  return {
    id: 'enc:1', bossId: 'medusa', sequence: 1, status: 'active', scheduledFor: windowStart,
    windowStart, windowEnd: shiftKey(windowStart, 4), goal: 4,
    rewardGranted: false, damageApplied: false, createdAt: '2026-10-01T00:00:00.000Z', ...changes,
  }
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

test('Succubus roba hasta diez de vida al activarse y cada tarea recupera sangre', () => {
  const scheduled = {
    id: 'enc:1', bossId: 'succubus', sequence: 1, status: 'scheduled', scheduledFor: '2026-10-10',
    rewardGranted: false, damageApplied: false, createdAt: '2026-10-01T00:00:00.000Z',
  }
  const activated = sync({ encounters: [scheduled], profile: profile({ hp: 8, maxHp: 20 }) }, '2026-10-10')
  const encounter = activated.encounters.find((entry) => entry.sequence === 1)
  assert.equal(initialLifeStolen(profile({ hp: 8 })), 7)
  assert.equal(encounter.status, 'active')
  assert.equal(encounter.goal, 7)
  assert.equal(activated.profile.hp, 1)
  assert.equal(activated.profile.dead, false)

  const items = [chore('easy'), chore('hard', { difficulty: 'hard' })]
  const progress = lifeProgress(
    { ...encounter, goal: 7 },
    items,
    byItem([done('easy', '2026-10-10'), done('hard', '2026-10-10'), done('hard', '2026-10-10', { id: 'hard:duplicate' })]),
    '2026-10-10',
  )
  assert.equal(progress.recovered, 3)
  assert.equal(progress.reachedOn, undefined)
  assert.equal(bossCountsFor(items[0], encounter, '2026-10-10'), true)
  assert.equal(hidesTomorrow(SUCCUBUS), true)
})

test('Succubus se vence recuperando toda la sangre sin volver a descontar vida', () => {
  const items = Array.from({ length: 5 }, (_, index) => chore(`hard-${index}`, { difficulty: 'hard' }))
  const completions = items.map((item) => done(item.id, '2026-10-10'))
  const result = sync({
    items,
    completions,
    encounters: [succubusBoss()],
    profile: profile({ hp: 30 }),
  }, '2026-10-10', () => 0)
  const victory = result.encounters.find((entry) => entry.sequence === 1)
  assert.equal(victory.status, 'victory')
  assert.equal(victory.resolvedOn, '2026-10-10')
  assert.equal(result.profile.hp, 55)
  assert.equal(result.profile.curses.length, 0)
  assert.deepEqual(victory.rewards, {
    xp: 120, coins: 60, items: { postponeToken: 1, vitalityPotion: 1, streakFreeze: 1, holyWater: 1 },
    souls: { succubus: { id: 'succubus', rank: 1, repeated: false, upgraded: false } },
  })
  const summary = summarizeBoss(victory, items, byItem(completions), '2026-10-10')
  assert.equal(summary.damage, 10)
  assert.equal(summary.bars[0].hp, 0)
})

test('Succubus derrota sin daño adicional y aplica Encanto durante cinco días', () => {
  const result = sync({
    encounters: [succubusBoss('2026-10-10', { windowEnd: '2026-10-10' })],
    profile: profile({ hp: 30 }),
  }, '2026-10-11', () => 0)
  const defeat = result.encounters.find((entry) => entry.sequence === 1)
  assert.equal(defeat.status, 'defeat')
  assert.equal(defeat.curse, 'charm')
  assert.equal(result.profile.hp, 30)
  assert.deepEqual(result.profile.curses, [{
    id: 'charm',
    sourceBoss: 'succubus',
    startedOn: '2026-10-11',
    expiresOn: '2026-10-16',
  }])
})

test('Death suma una hoz por obligación incumplida y bloquea congelaciones', () => {
  const item = chore('death-task', { createdAt: '2026-10-10T12:00:00' })
  const encounter = deathBoss()
  assert.equal(scytheProgress(encounter, [item], {}, '2026-10-10').scythes, 1)
  const protectedMiss = computeMissedPenalties(
    [item], {}, undefined, 1, { enabled: false }, '2026-10-10', () => 1, false,
  )
  assert.equal(protectedMiss.totalDamage, 1)
  assert.equal(protectedMiss.freezesUsed, 0)
  assert.equal(describeEffect(DEATH.effects[0]), 'Mirada · protecciones bloqueadas')
})

test('Death evita daño mortal de bosses y registra la activación del rango diario', () => {
  const date = '2026-10-11'
  const equipped = profile({
    hp: 1,
    souls: { death: { rank: 2, fragments: 0 } },
    equippedSouls: ['death'],
    dailySoulLoadout: { date, souls: ['death'] },
  })
  assert.equal(applyBossDamage(equipped, 2, date, 1).hp, 1)
  assert.equal(applyBossDamage(equipped, 2, date, 1).dead, false)

  const result = planBossSync({
    today: date,
    profile: equipped,
    items: [],
    completionsByItem: {},
    encounters: [activeBoss('2026-10-10', { windowEnd: '2026-10-10', goal: 5 })],
    daySnapshots: [{
      date,
      runStartedAt: equipped.runStartedAt,
      level: 1,
      xp: 0,
      hp: 1,
      maxHp: 50,
      soulLoadout: ['death'],
      soulRanks: { death: 2 },
    }],
    random: () => 0,
  })
  assert.equal(result.profile.hp, 1)
  assert.equal(result.profile.dead, false)
  assert.equal(result.passiveActivations.length, 1)
  assert.equal(result.passiveActivations[0].soulId, 'death')
  assert.equal(result.passiveActivations[0].rank, 2)
  assert.equal(result.passiveActivations[0].sourceId, 'boss:giant-bat:1:defeat')

  const retried = planBossSync({
    today: date,
    profile: result.profile,
    items: [],
    completionsByItem: {},
    encounters: result.encounters,
    soulPassiveActivations: result.passiveActivations,
    daySnapshots: [{
      date,
      runStartedAt: equipped.runStartedAt,
      level: 1,
      xp: 0,
      hp: 1,
      maxHp: 50,
      soulLoadout: ['death'],
      soulRanks: { death: 2 },
    }],
    random: () => 0,
  })
  assert.equal(retried.profile.hp, 1)
  assert.equal(retried.passiveActivations.length, 0)
})

test('Medusa selecciona estatuas de forma determinista y deriva su progreso', () => {
  const encounter = medusaBoss()
  const items = [chore('a'), chore('b'), chore('c'), chore('d')]
  const first = statueItemsOn(encounter, items, '2026-10-10')
  assert.deepEqual(statueItemsOn(encounter, items, '2026-10-10').map((item) => item.id), first.map((item) => item.id))
  assert.ok(first.length >= 1 && first.length <= 3)
  const completions = first.map((item) => done(item.id, '2026-10-10'))
  const progress = statueProgress(encounter, items, byItem(completions), '2026-10-10')
  assert.equal(progress.broken, first.length)
  assert.equal(progress.missed, 0)
  assert.equal(progress.net, first.length)
})

test('Medusa duplica el daño solo para una estatua que llega sin romper', () => {
  const encounter = medusaBoss()
  const items = [chore('a'), chore('b'), chore('c'), chore('d')]
    .map((item) => ({ ...item, createdAt: '2026-10-10T12:00:00' }))
  const statues = statueItemsOn(encounter, items, '2026-10-10')
  const regular = items.find((item) => !statues.some((statue) => statue.id === item.id))
  assert.ok(statues.length > 0)
  assert.ok(regular)
  const result = computeMissedPenalties(
    items, {}, undefined, 0, { enabled: false }, '2026-10-10',
    (dateKey, item) => isMedusaStatueOn(encounter, item, dateKey, items) ? 2 : 1,
  )
  assert.equal(result.missedEvents.find((event) => event.itemId === statues[0].id).damage, 2)
  assert.equal(result.missedEvents.find((event) => event.itemId === regular.id).damage, 1)
})

test('Mirada bloquea simultáneamente escudo y congelación durante Medusa', () => {
  const encounter = medusaBoss()
  const item = chore('protected', { createdAt: '2026-10-10T12:00:00' })
  assert.equal(protectionsDisabledOn(encounter, '2026-10-10'), true)
  const result = computeMissedPenalties(
    [item], {}, undefined, 1, { enabled: true }, '2026-10-10',
    () => 1, false, () => false,
  )
  assert.equal(result.totalDamage, 1)
  assert.equal(result.freezesUsed, 0)
  assert.equal(result.missedEvents[0].protectedBy, undefined)
})

test('Medusa se activa con una racha de catorce días y aplica Amnesia al perder', () => {
  const item = chore('streak')
  const completions = Array.from({ length: 14 }, (_, index) => done('streak', shiftKey('2026-10-01', index)))
  assert.equal(reactiveBoss({
    today: '2026-10-14',
    profile: profile(),
    items: [item],
    completionsByItem: byItem(completions),
    encounters: [],
  }), 'medusa')
  const result = sync({
    items: [chore('missed')],
    encounters: [medusaBoss()],
    profile: profile({ hp: 50, relics: ['silverMirror'] }),
  }, '2026-10-15')
  const defeat = result.encounters.find((entry) => entry.sequence === 1)
  assert.equal(defeat.status, 'defeat')
  assert.deepEqual(result.profile.curses, [{
    id: 'amnesia', sourceBoss: 'medusa', startedOn: '2026-10-15', expiresOn: '9999-12-31', permanent: true,
  }])
  assert.deepEqual(result.profile.relics, ['silverMirror'])
  assert.equal(historicalStatsVisible(result.profile.curses, result.profile.relics), false)
  const repeated = sync({
    items: [chore('missed')],
    encounters: result.encounters,
    profile: result.profile,
  }, '2026-10-15')
  assert.deepEqual(repeated.changed, [])
  assert.deepEqual(repeated.encounters, result.encounters)
  assert.deepEqual(repeated.profile, result.profile)
})

test('la revancha de Medusa elimina Amnesia y conserva el Espejo', () => {
  const cursed = profile({
    curses: [{ id: 'amnesia', sourceBoss: 'medusa', startedOn: '2026-10-14', expiresOn: '9999-12-31', permanent: true }],
    relics: ['silverMirror'],
  })
  const recovered = applyBossRevenge(cursed, MEDUSA)
  assert.deepEqual(recovered.curses, [])
  assert.deepEqual(recovered.relics, ['silverMirror'])
  assert.equal(historicalStatsVisible(recovered.curses, recovered.relics), true)
})

test('Death derrota con cinco hoces y deja Hoz permanente reduciendo la vida máxima', () => {
  const result = sync({
    items: [chore('death-task')],
    encounters: [deathBoss()],
    profile: profile({ hp: 50 }),
  }, '2026-10-14')
  const defeat = result.encounters.find((entry) => entry.sequence === 1)
  assert.equal(defeat.status, 'defeat')
  assert.equal(defeat.resolvedOn, '2026-10-14')
  assert.deepEqual(result.profile.curses, [{
    id: 'deathScythe', sourceBoss: 'death', startedOn: '2026-10-14', expiresOn: '9999-12-31', permanent: true,
  }])
  assert.equal(result.profile.hp, 45)
  assert.equal(effectiveMaxHp(result.profile, '2030-01-01'), 45)
})

test('Death paga la apuesta por tres cuando termina sin hoces', () => {
  const item = chore('death-task')
  const completions = Array.from({ length: 5 }, (_, index) => done('death-task', shiftKey('2026-10-10', index)))
  const result = sync({
    items: [item],
    completions,
    encounters: [deathBoss('2026-10-10', { stakePercent: 10, stakeCoins: 10 })],
    profile: profile({ coins: 90 }),
  }, '2026-10-15', () => 0.99)
  const victory = result.encounters.find((entry) => entry.sequence === 1)
  assert.equal(victory.status, 'victory')
  assert.equal(victory.resolvedOn, '2026-10-14')
  assert.equal(victory.rewards.coins, 150)
  assert.equal(result.profile.coins, 240)
})

test('Death conserva los premios definidos en boss-roster', () => {
  assert.equal(DEATH.soulChance, 0.015)
  assert.deepEqual(DEATH.drops, [
    { item: 'streakFreeze', chance: 0.45, min: 1, max: 1 },
    { item: 'holyWater', chance: 0.3, min: 1, max: 1 },
    { item: 'vitalityPotion', chance: 0.3, min: 1, max: 1 },
    { item: 'postponeToken', chance: 0.3, min: 1, max: 1 },
  ])
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
    souls: { 'giant-bat': { id: 'giant-bat', rank: 1, repeated: false, upgraded: false } },
    relics: ['rosary'],
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

test('una recompensa de boss al subir de nivel recupera la mitad de la vida máxima sin superar el máximo', () => {
  const result = applyBossReward(profile({
    level: 1,
    xp: 70,
    hp: 5,
    maxHp: 20,
  }), { xp: 10, coins: 0, items: {} })
  assert.equal(result.leveledUp, true)
  assert.equal(result.profile.level, 2)
  assert.equal(result.profile.maxHp, 25)
  assert.equal(result.profile.hp, 18)
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

test('la piedad de alma sube hasta 20 puntos y se reinicia al conseguirla', () => {
  const base = profile({ soulPity: { 'giant-bat': 19 } })
  const miss = collectSoul(base, 'giant-bat', 0, () => 1)
  assert.equal(miss.profile.soulPity['giant-bat'], 20)
  assert.equal(soulChanceWithPity(0.03, miss.profile.soulPity['giant-bat']), 0.23)
  const hit = collectSoul(miss.profile, 'giant-bat', 0.23, () => 0)
  assert.equal(hit.profile.soulPity['giant-bat'], 0)
  assert.deepEqual(hit.profile.souls['giant-bat'], { rank: 1, fragments: 0 })
  assert.equal(hit.award.repeated, false)
})

test('las maldiciones graves tienen efectos persistentes y respetan el límite de dos', () => {
  const petrification = addCurse([], 'petrification', 'giant-bat', '2026-10-10', 0)
  const amnesia = addCurse(petrification, 'amnesia', 'giant-bat', '2026-10-10', 0)
  const limited = addCurse(amnesia, 'chains', 'giant-bat', '2026-10-10', 0)
  assert.equal(petrification[0].permanent, true)
  assert.equal(petrification[0].expiresOn, '9999-12-31')
  assert.equal(limited.length, 2)
  assert.equal(freezesEnabled({ curses: petrification }, '2026-10-10'), false)
  assert.equal(canPostpone({ curses: limited }, '2026-10-10'), false)
  assert.equal(modifyDamage(2, { curses: limited }, '2026-10-10'), 4)
  assert.equal(historicalStatsVisible(amnesia), false)
  assert.equal(historicalStatsVisible(undefined), false)
  assert.equal(historicalStatsVisible(undefined, ['silverMirror']), true)
  assert.equal(historicalStatsVisible(amnesia, ['silverMirror']), false)
})

test('la revancha de un boss elimina la maldición grave que declara', () => {
  const profileWithCurse = profile({
    curses: addCurse([], 'petrification', 'giant-bat', '2026-10-10', 0),
    penanceProgress: { petrification: 2 },
  })
  const boss = { ...BAT, revengeCurse: 'petrification' }
  const result = applyBossRevenge(profileWithCurse, boss)
  assert.deepEqual(result.curses, [])
  assert.equal(result.penanceProgress.petrification, 0)
})

test('la penitencia cura una maldición grave tras tres días completos y se reinicia al fallar', () => {
  const item = chore('penance')
  const curse = addCurse([], 'petrification', 'giant-bat', '2026-10-10', 0)
  let current = profile({ curses: curse })
  const history = byItem([done('penance', '2026-10-10')])
  for (let day = 0; day < 3; day += 1) {
    current = applyPenance(current, [item], history, '2026-10-10')
  }
  assert.equal(current.curses.length, 0)
  const reset = applyPenance(
    profile({ curses: curse, penanceProgress: { petrification: 2 } }),
    [item],
    {},
    '2026-10-10',
  )
  assert.equal(reset.penanceProgress.petrification, 0)
  assert.equal(reset.curses.length, 1)
})

test('las almas repetidas acumulan tres fragmentos y ascienden hasta rango 3', () => {
  let current = profile({ souls: { legion: { rank: 1, fragments: 0 } } })
  const awards = []
  for (let index = 0; index < 3; index += 1) {
    const result = collectSoul(current, 'legion', 1, () => 0)
    current = result.profile
    awards.push(result.award)
  }
  assert.deepEqual(current.souls.legion, { rank: 2, fragments: 0 })
  assert.equal(awards[2].upgraded, true)
  const maxed = collectSoul(current, 'legion', 1, () => 0)
  assert.deepEqual(maxed.profile.souls.legion, { rank: 2, fragments: 1 })
  assert.deepEqual([soulSlotsForLevel(1), soulSlotsForLevel(5), soulSlotsForLevel(10), soulSlotsForLevel(20)], [0, 1, 2, 3])
})

test('las pasivas solo se activan para almas equipadas y obtenidas, sin duplicados obsoletos', () => {
  const base = profile({
    souls: {
      legion: { rank: 2, fragments: 0 },
      medusa: { rank: 1, fragments: 0 },
    },
    equippedSouls: ['legion', 'legion', 'giant-bat', 'medusa'],
  })
  assert.equal(equippedSoulRank(base, 'legion'), 2)
  assert.equal(equippedSoulRank(base, 'giant-bat'), 0)
  const locked = { ...base, dailySoulLoadout: { date: '2026-10-30', souls: ['legion'] } }
  assert.equal(equippedSoulRank(locked, 'legion', '2026-10-30'), 2)
  assert.equal(equippedSoulRank(locked, 'legion', '2026-10-31'), 0)
  assert.deepEqual(equippedSoulPassives(base), [
    { id: 'legion', passiveId: 'trivialCoins', rank: 2 },
    { id: 'medusa', passiveId: 'weeklyFreeze', rank: 1 },
  ])
  assert.deepEqual(base.equippedSouls, ['legion', 'legion', 'giant-bat', 'medusa'])
})

test('la pasiva de Legion añade monedas solo a tareas triviales y escala por rango', () => {
  const rankOne = profile({
    souls: { legion: { rank: 1, fragments: 0 } },
    equippedSouls: ['legion'],
  })
  const rankThree = profile({
    souls: { legion: { rank: 3, fragments: 0 } },
    equippedSouls: ['legion'],
  })
  assert.equal(modifyCoins(2, { soulProfile: rankOne, itemDifficulty: 'trivial' }, '2026-10-30'), 3)
  assert.equal(modifyCoins(2, { soulProfile: rankThree, itemDifficulty: 'trivial' }, '2026-10-30'), 5)
  assert.equal(modifyCoins(2, { soulProfile: rankThree, itemDifficulty: 'easy' }, '2026-10-30'), 2)
  assert.equal(modifyCoins(2, { itemDifficulty: 'trivial' }, '2026-10-30'), 2)
})

test('la pasiva de Frankenstein bonifica una sola primera tarea por zona y escala por rango', () => {
  const date = '2026-10-30'
  const item = zoneTodo('zone-a-2', 'castle')
  const first = zoneTodo('zone-a-1', 'castle')
  const otherZone = zoneTodo('zone-b-1', 'garden')
  const noZone = chore('unassigned')
  const items = [item, first, otherZone, noZone]
  const completions = byItem([done(first.id, date)])
  const rankOne = profile({
    souls: { frankenstein: { rank: 1, fragments: 0 } },
    equippedSouls: ['frankenstein'],
    dailySoulLoadout: { date, souls: ['frankenstein'] },
  })
  const rankThree = { ...rankOne, souls: { frankenstein: { rank: 3, fragments: 0 } } }

  assert.equal(isFirstZoneCompletionOn(item, items, completions, date), false)
  assert.equal(isFirstZoneCompletionOn(otherZone, items, completions, date), true)
  assert.equal(isFirstZoneCompletionOn(noZone, items, completions, date), false)
  assert.equal(modifyXp(10, {
    soulProfile: rankOne,
    soulDate: date,
    soulFirstZone: true,
  }, date), 12)
  assert.equal(modifyXp(10, {
    soulProfile: {
      ...rankOne,
      souls: { frankenstein: { rank: 2, fragments: 0 } },
    },
    soulDate: date,
    soulFirstZone: true,
  }, date), 13)
  assert.equal(modifyXp(10, {
    soulProfile: rankThree,
    soulDate: date,
    soulFirstZone: true,
  }, date), 14)
  assert.equal(modifyXp(10, {
    soulProfile: rankThree,
    soulDate: date,
    soulFirstZone: false,
  }, date), 10)
  assert.equal(modifyXp(10, {
    soulProfile: rankThree,
    soulDate: '2026-10-31',
    soulFirstZone: true,
  }, date), 10)
})

test('las reliquias de primera victoria se conceden por expedición y el Corazón de Legion escala con sus victorias', () => {
  const first = sync({
    encounters: [activeBoss()],
    profile: profile({ level: 10 }),
    items: [chore('a')],
    completions: [done('a', '2026-10-10'), done('a', '2026-10-12')],
  }, '2026-10-12', () => 0.99)
  assert.deepEqual(first.profile.relics, ['rosary'])
  const previous = first.encounters.find((entry) => entry.sequence === 1)
  const repeated = sync({
    encounters: [activeBoss('2026-10-10', { resolvedOn: undefined }), previous],
    profile: first.profile,
    items: [chore('a')],
    completions: [done('a', '2026-10-10'), done('a', '2026-10-12')],
  }, '2026-10-12', () => 0.99)
  assert.equal(repeated.profile.relics.length, 1)
  assert.equal(effectiveMaxHp({ ...profile(), relics: ['heart'] }), 51)
})

test('el Corazón de Legion concede una vida máxima por victoria y se reinicia sin reliquia', () => {
  assert.deepEqual([
    relicMaxHpBonus([], 5),
    relicMaxHpBonus(['heart'], 0),
    relicMaxHpBonus(['heart'], 1),
    relicMaxHpBonus(['heart'], 3),
  ], [0, 0, 1, 3])
  assert.equal(effectiveMaxHp({ ...profile(), relics: ['heart'], legionVictories: 3 }), 53)
  assert.equal(effectiveMaxHp({ ...profile(), relics: [], legionVictories: 0 }), 50)
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

test('Legion exige romper la cáscara antes de dañar el núcleo', () => {
  const items = [
    chore('medium-a', { difficulty: 'medium' }),
    chore('medium-b', { difficulty: 'medium' }),
    chore('medium-c', { difficulty: 'medium' }),
    chore('hard-a', { difficulty: 'hard' }),
    chore('easy-a', { difficulty: 'easy' }),
  ]
  const completions = [
    done('medium-a', '2026-10-10'),
    done('medium-b', '2026-10-10'),
    done('hard-a', '2026-10-10'),
    done('easy-a', '2026-10-11'),
  ]
  const progress = hitProgress(legionBoss(), items, byItem(completions), '2026-10-11')
  assert.equal(progress.guardHits, 3)
  assert.equal(progress.guardBrokenOn, '2026-10-10')
  assert.equal(progress.damage, 2)

  const summary = summarizeBoss(legionBoss(), items, byItem(completions), '2026-10-11')
  assert.deepEqual(summary.bars, [
    { name: 'Cáscara', max: 3, hp: 0 },
    { name: 'Núcleo', max: 8, hp: 6 },
  ])
  assert.equal(bestiaryMechanic(LEGION), 'Rompe la cáscara con 3 golpes de tareas medias o difíciles; después cualquier tarea hiere el núcleo.')
})

test('Legion escala la vida del núcleo y aplica sus premios y entorno', () => {
  const daily = Array.from({ length: 6 }, (_, index) => chore(`legion-${index}`, { createdAt: '2026-09-01T12:00:00' }))
  assert.equal(bossGoal(LEGION, daily, '2026-10-20'), 22)
  const active = legionBoss()
  assert.equal(effectPercent(active, 'damagePercent', '2026-10-11'), 150)
  assert.equal(effectPercent(active, 'damagePercent', '2026-10-13'), 100)
  assert.equal(effectPercentOn({ ...active, status: 'victory' }, 'damagePercent', '2026-10-11'), 150)
  assert.equal(describeEffect(LEGION.effects[0]), 'Daño por fallo ×1,5')

  const rewards = rollRewards(LEGION, 1, () => 0)
  assert.deepEqual(rewards, {
    xp: 110,
    coins: 140,
    items: { postponeToken: 1, vitalityPotion: 1 },
  })
})

test('Legion se vence al romper la cáscara y agotar después el núcleo', () => {
  const items = [
    chore('medium-a', { difficulty: 'medium' }),
    chore('medium-b', { difficulty: 'medium' }),
    chore('medium-c', { difficulty: 'medium' }),
    chore('hard-a', { difficulty: 'hard' }),
    chore('hard-b', { difficulty: 'hard' }),
    chore('easy-a', { difficulty: 'easy' }),
  ]
  const completions = [
    done('medium-a', '2026-10-10'),
    done('medium-b', '2026-10-10'),
    done('hard-a', '2026-10-10'),
    done('hard-b', '2026-10-11'),
    done('medium-c', '2026-10-11'),
    done('easy-a', '2026-10-11'),
  ]
  const result = sync({
    items,
    completions,
    encounters: [legionBoss()],
    profile: profile({ level: 1 }),
  }, '2026-10-11', () => 0)
  const [victory] = result.encounters
  assert.equal(victory.status, 'victory')
  assert.equal(victory.resolvedOn, '2026-10-11')
  assert.equal(result.profile.coins, 140)
  assert.equal(result.profile.postponeTokens, 1)
  assert.equal(result.profile.vitalityPotions, 1)
  assert.equal(result.profile.legionVictories, 1)
  assert.equal(effectiveMaxHp(result.profile), 56)
})

test('Legion derrota, hiere y aplica Pesadez si no se rompe su cáscara', () => {
  const result = sync({
    encounters: [legionBoss()],
    profile: profile({ hp: 40 }),
  }, '2026-10-13')
  const [defeat] = result.encounters
  assert.equal(defeat.status, 'defeat')
  assert.equal(defeat.curse, 'heaviness')
  assert.equal(result.profile.hp, 25)
  assert.deepEqual(result.profile.curses.map((curse) => [curse.id, curse.sourceBoss, curse.expiresOn]), [
    ['heaviness', 'legion', '2026-10-20'],
  ])
})

test('Frankenstein fija las zonas disponibles y desactiva sus piezas al cumplirlas', () => {
  const items = [zoneTodo('a', 'A'), zoneTodo('b', 'B'), zoneTodo('c', 'C'), zoneTodo('d', 'D')]
  assert.deepEqual(bossZones(FRANKENSTEIN, items), ['A', 'B', 'C', 'D'])
  const encounter = frankensteinBoss('2026-10-10', { zones: ['A', 'B', 'C', 'D'], goal: 4 })
  const progress = pieceProgress(
    encounter,
    items,
    byItem([done('a', '2026-10-10'), done('b', '2026-10-10'), done('c', '2026-10-10')]),
    '2026-10-10',
  )
  assert.deepEqual(progress.disabledZones, ['A', 'B', 'C'])
  assert.equal(progress.reachedOn, undefined)
})

test('Igor remienda una pieza por cada día con obligaciones incumplidas', () => {
  const items = [zoneTodo('a', 'A'), zoneTodo('b', 'B', '2026-10-11'), zoneTodo('c', 'C', '2026-10-11')]
  const progress = pieceProgress(
    frankensteinBoss(),
    items,
    byItem([done('a', '2026-10-10'), done('b', '2026-10-11')]),
    '2026-10-11',
  )
  assert.deepEqual(progress.disabledZones, ['B'])
})

test('Relámpagos duplica EXP y daño solo en la zona cargada del día', () => {
  const encounter = frankensteinBoss()
  const charged = chargedZoneOn(encounter, '2026-10-10')
  assert.ok(charged)
  assert.equal(effectPercentForItem(encounter, 'xpPercent', '2026-10-10', charged), 200)
  assert.equal(effectPercentForItem(encounter, 'xpPercent', '2026-10-10', 'other'), 100)
  assert.equal(effectPercentForItem({ ...encounter, status: 'victory' }, 'xpPercent', '2026-10-10', charged), 100)
})

test('Frankenstein se vence con todas las piezas y concede sus premios', () => {
  const items = [zoneTodo('a', 'A'), zoneTodo('b', 'B'), zoneTodo('c', 'C')]
  const result = planBossSync({
    today: '2026-10-10',
    items,
    completionsByItem: byItem(items.map((item) => done(item.id, '2026-10-10'))),
    encounters: [frankensteinBoss()],
    profile: profile(),
    random: () => 0,
  })
  const [victory] = result.encounters
  assert.equal(victory.status, 'victory')
  assert.equal(victory.resolvedOn, '2026-10-10')
  assert.equal(victory.rewards.xp, 130)
  assert.equal(victory.rewards.coins, 70)
  assert.deepEqual(victory.rewards.items, {
    postponeToken: 1, vitalityPotion: 1, streakFreeze: 1, holyWater: 1,
  })
})

test('Frankenstein derrota, aplica Costuras y reduce la vida máxima', () => {
  const result = planBossSync({
    today: '2026-10-11',
    items: [zoneTodo('a', 'A')],
    completionsByItem: {},
    encounters: [frankensteinBoss('2026-10-10', { windowEnd: '2026-10-10', goal: 1, zones: ['A'] })],
    profile: profile({ hp: 40 }),
    random: () => 0,
  })
  const [defeat] = result.encounters
  assert.equal(defeat.status, 'defeat')
  assert.equal(defeat.curse, 'stitches')
  assert.equal(result.profile.hp, 20)
  assert.equal(result.profile.maxHp, 50)
  assert.equal(effectiveMaxHp(result.profile, '2026-10-11'), 45)
})

test('el daño por fallo de Legion se redondea hacia arriba tras multiplicarlo por 1,5', () => {
  const item = chore('missed', { createdAt: '2026-10-11T12:00:00' })
  const active = legionBoss()
  const result = computeMissedPenalties(
    [item],
    {},
    undefined,
    0,
    { enabled: false },
    '2026-10-11',
    (date) => effectPercent(active, 'damagePercent', date) / 100,
  )
  assert.equal(result.totalDamage, 2)
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

  const draculaBat = draculaBoss(day, { draculaPhase: 'bat' })
  const draculaDemon = draculaBoss(day, { draculaPhase: 'demon' })
  assert.equal(bossCountsFor(habit, draculaBat, day), true)
  assert.equal(bossCountsFor(habit, draculaBoss(day, { draculaPhase: 'human' }), day), false)
  assert.equal(bossCountsFor(habit, draculaDemon, day), false)
  assert.equal(bossCountsFor(obligation, draculaDemon, day), true)
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
  assert.equal(pickBoss('slogra-gaibon', () => 0.99), 'doppelganger')
  assert.deepEqual(new Set([pickBoss(undefined, () => 0), pickBoss(undefined, () => 0.99)]), new Set(['giant-bat', 'doppelganger']))
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

test('el clima diario es determinista y sus pesos forman un catálogo válido', () => {
  const first = weatherForDay('2026-10-30', 'castle-seed')
  assert.equal(first, selectWeather('2026-10-30', 'castle-seed'))
  assert.equal(weatherForDay('2026-10-30', 'castle-seed'), first)
  assert.equal(WEATHER_PROFILES.reduce((total, profile) => total + profile.weight, 0), 100)
  assert.deepEqual(WEATHER_PROFILES.map((profile) => profile.kind), [
    'clear',
    'clouded',
    'fog',
    'rain',
    'storm',
    'eclipse',
  ])
  for (const profile of WEATHER_PROFILES) {
    assert.equal(weatherProfile(profile.kind), profile)
    assert.ok(profile.weight > 0)
    assert.ok(profile.label)
    assert.ok(profile.description)
  }
})

test('la semilla del clima persiste y usa una semilla de sesión si el almacenamiento falla', () => {
  resetWeatherSeedForTests()
  let value = null
  const storage = {
    getItem: () => value,
    setItem: (_key, next) => { value = next },
  }
  const persisted = weatherSeed(storage)
  assert.equal(weatherSeed(storage), persisted)

  resetWeatherSeedForTests()
  const restored = weatherSeed(storage)
  assert.equal(restored, persisted)

  resetWeatherSeedForTests()
  const brokenStorage = {
    getItem: () => { throw new Error('storage unavailable') },
    setItem: () => { throw new Error('storage unavailable') },
  }
  const session = weatherSeed(brokenStorage)
  assert.equal(weatherSeed(brokenStorage), session)
  assert.ok(session.length > 0)
})
