import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { computeMissedPenalties } from '../src/lib/penalties.ts'
import { modifyCoins, modifyDamage, modifyXp } from '../src/lib/modifiers.ts'
import { canPurchaseAncientAmulet, RELICS, relicMaxHpBonus } from '../src/lib/relics.ts'
import { SYSTEM_RESOURCES } from '../src/lib/resources.ts'
import { applyBossDamage, eclipseAdjustedRewards } from '../src/lib/bosses.ts'
import { addCurse, tickCurses } from '../src/lib/curses.ts'
import {
  eclipseMultiplierForDay,
  resetWeatherSeedForTests,
  selectWeather,
  weatherSeed,
} from '../src/lib/weather.ts'
import { ANCIENT_AMULET, ANCIENT_AMULET_PALETTE } from '../src/lib/pixelArt.ts'

const seed = 'eclipse-effects-test-seed'
const eclipseDate = Array.from({ length: 366 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10)
  return date
}).find((date) => selectWeather(date, seed) === 'eclipse')
const clearDate = Array.from({ length: 366 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10)
  return date
}).find((date) => selectWeather(date, seed) !== 'eclipse')

beforeEach(() => {
  resetWeatherSeedForTests()
  weatherSeed({ getItem: () => seed, setItem: () => {} })
})

test('el eclipse duplica EXP, monedas y daño; el resto de climas conserva sus valores', () => {
  assert.ok(eclipseDate)
  assert.ok(clearDate)
  const context = { boss: null, curses: [] }

  assert.equal(eclipseMultiplierForDay(eclipseDate), 2)
  assert.equal(modifyXp(10, context, eclipseDate), 20)
  assert.equal(modifyCoins(10, context, eclipseDate), 20)
  assert.equal(modifyDamage(3, context, eclipseDate), 6)

  assert.equal(eclipseMultiplierForDay(clearDate), 1)
  assert.equal(modifyXp(10, context, clearDate), 10)
  assert.equal(modifyCoins(10, context, clearDate), 10)
  assert.equal(modifyDamage(3, context, clearDate), 3)
})

test('el daño por incumplimiento del eclipse se guarda ya multiplicado', () => {
  assert.ok(eclipseDate)
  const item = {
    id: 'daily-task',
    title: 'Tarea diaria',
    type: 'chore',
    difficulty: 'easy',
    trackingType: 'boolean',
    archived: false,
    createdAt: `${eclipseDate}T00:00:00`,
  }
  const result = computeMissedPenalties(
    [item],
    {},
    undefined,
    0,
    { enabled: false },
    eclipseDate,
    (dateKey) => eclipseMultiplierForDay(dateKey),
  )

  assert.equal(result.totalDamage, 2)
  assert.equal(result.missedEvents[0].damage, 2)
})

test('el eclipse duplica el daño de bosses y maldiciones y las recompensas de bosses', () => {
  assert.ok(eclipseDate)
  const player = { hp: 20, dead: false }
  assert.equal(applyBossDamage(player, 3, eclipseDate).hp, 14)

  const poison = addCurse([], 'poison', 'giant-bat', eclipseDate, 5)
  assert.equal(tickCurses(poison, 20, eclipseDate, eclipseMultiplierForDay).hp, 18)

  assert.deepEqual(
    eclipseAdjustedRewards({ xp: 10, coins: 5, items: {} }, eclipseDate),
    { xp: 20, coins: 10, items: {} },
  )
  assert.deepEqual(
    eclipseAdjustedRewards({ xp: 10, coins: 5, items: {} }, clearDate),
    { xp: 10, coins: 5, items: {} },
  )
})

test('el amuleto solo puede comprarse durante eclipse, una vez por expedición y sin efecto', () => {
  assert.ok(eclipseDate)
  assert.ok(clearDate)
  const profile = { dead: false, coins: 41269, relics: [] }
  assert.equal(SYSTEM_RESOURCES.ancientAmulet.cost, 41269)
  assert.equal(canPurchaseAncientAmulet(profile, eclipseDate, 41269), true)
  assert.equal(canPurchaseAncientAmulet(profile, clearDate, 41269), false)
  assert.equal(canPurchaseAncientAmulet({ ...profile, coins: 41268 }, eclipseDate, 41269), false)
  assert.equal(canPurchaseAncientAmulet({ ...profile, dead: true }, eclipseDate, 41269), false)
  assert.equal(
    canPurchaseAncientAmulet({ ...profile, relics: ['ancientAmulet'] }, eclipseDate, 41269),
    false,
  )
  assert.equal(RELICS.ancientAmulet.description, 'Pertenecía a un hombre muy callado...')
  assert.equal(relicMaxHpBonus(['ancientAmulet']), 0)
  assert.equal(ANCIENT_AMULET_PALETTE.R, '#8f1d3c')
  assert.ok(ANCIENT_AMULET.every((row) => row.length === ANCIENT_AMULET[0].length))
})
