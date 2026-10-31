import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createSoulPassiveActivation,
  planSoulPassiveActivationReconciliation,
  soulPassiveCooldownDays,
  soulPassiveCooldownReady,
  soulPassiveReadyOn,
} from '../src/lib/soulPassiveLedger.ts'
import { dailyPotionMultiplier } from '../src/lib/souls.ts'
import {
  dailySoulBonusTotals,
  reconcileDailySoulRewards,
} from '../src/lib/dailySoulRewards.ts'

function profile(changes = {}) {
  return {
    souls: { 'slogra-gaibon': { rank: 2, fragments: 0 }, medusa: { rank: 1, fragments: 0 } },
    equippedSouls: ['slogra-gaibon'],
    dailySoulLoadout: { date: '2026-10-31', souls: ['slogra-gaibon'] },
    ...changes,
  }
}

function activation(sourceId, changes = {}) {
  return {
    id: `run-a:dailyCoins:${sourceId}`,
    soulId: 'slogra-gaibon',
    passiveId: 'dailyCoins',
    rank: 2,
    date: '2026-10-31',
    runStartedAt: '2026-10-01T02:00:00.000Z',
    sourceId,
    ...changes,
  }
}

test('el registro de una pasiva es estable e idempotente para su fuente', () => {
  const input = {
    profile: profile(),
    soulId: 'slogra-gaibon',
    date: '2026-10-31',
    runStartedAt: '2026-10-01T02:00:00.000Z',
    sourceId: 'item-a:2026-10-31:postponed',
  }
  const first = createSoulPassiveActivation(input)

  assert.deepEqual(createSoulPassiveActivation(input), first)
  assert.equal(first.rank, 2)
  assert.equal(first.passiveId, 'dailyCoins')
  assert.equal(first.id, encodeURIComponent(input.runStartedAt) + ':dailyCoins:' + encodeURIComponent(input.sourceId))
})

test('una corrección usa la carga del snapshot y no equipa almas retroactivamente', () => {
  const input = {
    profile: profile({
      equippedSouls: ['medusa'],
      dailySoulLoadout: { date: '2026-10-31', souls: ['medusa'] },
    }),
    soulId: 'slogra-gaibon',
    date: '2026-10-30',
    runStartedAt: '2026-10-01T02:00:00.000Z',
    sourceId: 'completion-a',
    snapshot: { date: '2026-10-30', soulLoadout: ['slogra-gaibon'] },
  }
  assert.equal(createSoulPassiveActivation(input).rank, 2)
  assert.equal(createSoulPassiveActivation({ ...input, snapshot: { date: input.date } }), null)
  assert.equal(createSoulPassiveActivation({ ...input, snapshot: undefined }), null)
})

test('no se registra una pasiva para almas no obtenidas o fuera del loadout diario', () => {
  const input = {
    profile: profile(),
    soulId: 'medusa',
    date: '2026-10-31',
    runStartedAt: '2026-10-01T02:00:00.000Z',
    sourceId: 'miss-a',
  }
  assert.equal(createSoulPassiveActivation(input), null)
  assert.equal(createSoulPassiveActivation({
    ...input,
    profile: profile({ souls: {}, equippedSouls: ['medusa'], dailySoulLoadout: { date: input.date, souls: ['medusa'] } }),
  }), null)
})

test('la reconciliación elimina solo activaciones obsoletas de las fuentes afectadas', () => {
  const existing = [
    activation('source-a'),
    activation('source-b'),
    activation('other-run', { runStartedAt: 'run-b' }),
    activation('other-source'),
  ]
  const plan = planSoulPassiveActivationReconciliation(
    existing,
    '2026-10-01T02:00:00.000Z',
    ['source-a', 'source-b'],
    [activation('source-a', { rank: 3 })],
  )

  assert.deepEqual(plan.deleteIds, [activation('source-b').id])
  assert.deepEqual(plan.upsert, [activation('source-a', { rank: 3 })])
  assert.throws(() => planSoulPassiveActivationReconciliation(
    existing,
    '2026-10-01T02:00:00.000Z',
    ['source-a'],
    [activation('other-source')],
  ), /expedición y fuentes reconciliadas/)
})

test('Gaibon guarda el rango usado y aplica enfriamiento móvil desde la fecha de uso', () => {
  const activationForRank = (rank) => ({
    ...activation(`gaibon-rank-${rank}`, { rank }),
    soulId: 'slogra-gaibon',
    passiveId: 'weeklyPostpone',
  })

  assert.deepEqual([1, 2, 3].map(soulPassiveCooldownDays), [7, 5, 3])
  assert.equal(soulPassiveReadyOn(activationForRank(1)), '2026-11-07')
  assert.equal(soulPassiveCooldownReady([activationForRank(1)], '2026-11-06'), false)
  assert.equal(soulPassiveCooldownReady([activationForRank(1)], '2026-11-07'), true)
  assert.equal(soulPassiveCooldownReady([activationForRank(2)], '2026-11-05'), true)
  assert.equal(soulPassiveCooldownReady([activationForRank(3)], '2026-11-03'), true)
})

test('Succubus refuerza la primera poción según el rango y deja las siguientes normales', () => {
  assert.deepEqual([0, 1, 2, 3].map(dailyPotionMultiplier), [1, 2, 3, 4])
})

const rewardDate = '2026-10-31'
const rewardRun = '2026-10-01T02:00:00.000Z'

function rewardProfile(soulId, rank, date = rewardDate) {
  return {
    id: 1,
    level: 1,
    xp: 0,
    coins: 0,
    postponeTokens: 0,
    vitalityPotions: 0,
    hp: 10,
    maxHp: 10,
    streakFreezes: 0,
    holyWater: 0,
    curses: [],
    routes: {},
    equippedRoute: null,
    souls: { [soulId]: { rank, fragments: 0 } },
    equippedSouls: [soulId],
    dailySoulLoadout: { date, souls: [soulId] },
    runStartedAt: rewardRun,
  }
}

function rewardItem(id, changes = {}) {
  return {
    id,
    type: 'habit',
    commitment: 'obligation',
    title: id,
    difficulty: 'easy',
    trackingType: 'boolean',
    archived: false,
    createdAt: '2026-10-01T10:00:00.000Z',
    ...changes,
  }
}

function rewardCompletion(itemId, order, changes = {}) {
  return {
    id: `completion-${itemId}`,
    itemId,
    date: rewardDate,
    xpEarned: 100,
    coinsEarned: 2,
    createdAt: `2026-10-31T10:${String(order).padStart(2, '0')}:00.000Z`,
    ...changes,
  }
}

test('Murciélago concede 5/10/15 % del EXP diario según el rango', () => {
  for (const [rank, bonus] of [[1, 10], [2, 20], [3, 30]]) {
    const items = [rewardItem('a'), rewardItem('b')]
    const completions = [rewardCompletion('a', 1), rewardCompletion('b', 2)]
    const result = reconcileDailySoulRewards(
      rewardProfile('giant-bat', rank),
      items,
      completions,
      rewardDate,
    )
    assert.equal(result.xpBonus, bonus)
    assert.equal(result.completions.reduce((sum, entry) => sum + entry.xpEarned, 0), 200 + bonus)
    assert.equal(result.activations[0].rank, rank)
    assert.equal(result.activations[0].passiveId, 'dailyXp')
  }
})

test('Murciélago requiere al menos una obligación debida y no exige misiones secundarias', () => {
  const obligations = [rewardItem('a'), rewardItem('b')]
  const sideQuest = rewardItem('optional', { commitment: 'sideQuest' })
  const done = [rewardCompletion('a', 1), rewardCompletion('b', 2)]
  const profile = rewardProfile('giant-bat', 1)

  const optionalIncomplete = reconcileDailySoulRewards(
    profile, [...obligations, sideQuest], done, rewardDate,
  )
  assert.equal(optionalIncomplete.xpBonus, 10)

  const obligationIncomplete = reconcileDailySoulRewards(
    profile, [...obligations, sideQuest], done.slice(0, 1), rewardDate,
  )
  assert.equal(obligationIncomplete.xpBonus, 0)
  assert.deepEqual(obligationIncomplete.activations, [])

  const noObligations = reconcileDailySoulRewards(
    profile,
    [sideQuest],
    [rewardCompletion('optional', 1)],
    rewardDate,
  )
  assert.equal(noObligations.xpBonus, 0)
})

test('Slogra concede +5/+10/+15 monedas al quinto cumplimiento único, no al cuarto', () => {
  const items = Array.from({ length: 5 }, (_, index) => rewardItem(`task-${index}`))
  const completions = items.map((item, index) => rewardCompletion(item.id, index + 1))

  for (const [rank, bonus] of [[1, 5], [2, 10], [3, 15]]) {
    const profile = rewardProfile('slogra-gaibon', rank)
    assert.equal(
      reconcileDailySoulRewards(profile, items, completions.slice(0, 4), rewardDate).coinsBonus,
      0,
    )
    assert.equal(
      reconcileDailySoulRewards(
        profile,
        items,
        [...completions.slice(0, 4), { ...completions[0], id: 'duplicate-task-0' }],
        rewardDate,
      ).coinsBonus,
      0,
    )
    const result = reconcileDailySoulRewards(profile, items, completions, rewardDate)
    assert.equal(result.coinsBonus, bonus)
    assert.equal(result.completions.reduce((sum, entry) => sum + entry.coinsEarned, 0), 10 + bonus)
    assert.equal(result.activations[0].passiveId, 'dailyCoins')
  }
})

test('pasivas diarias respetan el loadout bloqueado del snapshot y no el equipo actual', () => {
  const profile = rewardProfile('slogra-gaibon', 3)
  profile.equippedSouls = ['slogra-gaibon']
  profile.dailySoulLoadout = { date: '2026-10-30', souls: ['slogra-gaibon'] }
  profile.souls['giant-bat'] = { rank: 1, fragments: 0 }
  const snapshot = { date: rewardDate, runStartedAt: rewardRun, soulLoadout: ['giant-bat'] }
  const items = [rewardItem('a')]
  const completions = [rewardCompletion('a', 1)]

  const result = reconcileDailySoulRewards(profile, items, completions, rewardDate, snapshot)
  assert.equal(result.xpBonus, 5)
  assert.equal(result.coinsBonus, 0)
  assert.deepEqual(result.activations.map((entry) => entry.soulId), ['giant-bat'])
})

test('no reutiliza una carga de snapshot que pertenece a otra expedición', () => {
  const profile = rewardProfile('giant-bat', 1)
  const result = reconcileDailySoulRewards(
    profile,
    [rewardItem('a')],
    [rewardCompletion('a', 1)],
    rewardDate,
    { date: rewardDate, runStartedAt: '2025-01-01T00:00:00.000Z', soulLoadout: ['giant-bat'] },
  )
  assert.equal(result.xpBonus, 0)
  assert.deepEqual(result.activations, [])
})

test('recalcular una fecha no retira ni reescribe bonos persistidos de otros días', () => {
  const profile = rewardProfile('giant-bat', 1)
  const yesterday = {
    ...rewardCompletion('a', 1, {
      date: '2026-10-30',
      xpEarned: 105,
      dailySoulBonusXp: 5,
    }),
  }
  const result = reconcileDailySoulRewards(
    profile,
    [rewardItem('a')],
    [yesterday],
    rewardDate,
  )
  assert.deepEqual(result.completions[0], yesterday)
})

test('recalcular una corrección quita y reasigna el bono sin duplicarlo', () => {
  const profile = rewardProfile('slogra-gaibon', 2)
  const items = Array.from({ length: 5 }, (_, index) => rewardItem(`task-${index}`))
  const four = items.slice(0, 4).map((item, index) => rewardCompletion(item.id, index + 1))
  const five = [...four, rewardCompletion('task-4', 5)]
  const first = reconcileDailySoulRewards(profile, items, five, rewardDate)
  assert.equal(first.coinsBonus, 10)
  assert.equal(dailySoulBonusTotals(first.completions, rewardDate).coins, 10)

  const repeated = reconcileDailySoulRewards(profile, items, first.completions, rewardDate)
  assert.deepEqual(repeated.completions, first.completions)
  assert.equal(repeated.coinsBonus, 10)

  const undone = reconcileDailySoulRewards(profile, items, first.completions.slice(0, 4), rewardDate)
  assert.equal(undone.coinsBonus, 0)
  assert.equal(dailySoulBonusTotals(undone.completions, rewardDate).coins, 0)
  const completedAgain = reconcileDailySoulRewards(profile, items, undone.completions.concat(five[4]), rewardDate)
  assert.equal(completedAgain.coinsBonus, 10)
  assert.equal(dailySoulBonusTotals(completedAgain.completions, rewardDate).coins, 10)
})
