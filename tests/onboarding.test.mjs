import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { RRule } from 'rrule'
import {
  ONBOARDING_GOALS,
  createSideQuestInput,
  recommendActivities,
} from '../src/lib/onboardingPlan.ts'

beforeEach((context) => {
  context.mock.timers.enable({
    apis: ['Date'],
    now: new Date(2026, 9, 28, 12).getTime(),
  })
})

test('el recomendador ofrece como máximo una actividad inicial por objetivo prioritario', () => {
  const activities = recommendActivities(
    ['movement', 'learning', 'home', 'creativity'],
    [0, 2, 4],
  )

  assert.equal(activities.length, 3)
  assert.deepEqual(activities.map((activity) => activity.goal), ['movement', 'learning', 'home'])
  assert.deepEqual(activities.map((activity) => activity.weekdays), [[0], [2], [4]])
  assert.ok(ONBOARDING_GOALS.length >= 6)
})

test('el recomendador elimina objetivos y días repetidos y devuelve vacío sin disponibilidad', () => {
  assert.deepEqual(recommendActivities(['movement', 'movement'], []), [])

  const activities = recommendActivities(['movement', 'movement'], [3, 3])
  assert.equal(activities.length, 1)
  assert.deepEqual(activities[0].weekdays, [3])
})

test('las actividades confirmables son misiones secundarias semanales sin ruta ni obligación', () => {
  const [activity] = recommendActivities(['learning'], [1, 5])
  const input = createSideQuestInput(activity)
  const rule = RRule.fromString(input.recurrenceRule)

  assert.equal(input.type, 'habit')
  assert.equal(input.commitment, 'sideQuest')
  assert.equal(input.difficulty, 'easy')
  assert.equal(input.routeId, undefined)
  assert.equal(input.startDate, '2026-10-28')
  assert.equal(rule.options.freq, RRule.WEEKLY)
  assert.deepEqual(rule.options.byweekday, [1])
})
