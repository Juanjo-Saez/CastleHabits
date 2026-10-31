import assert from 'node:assert/strict'
import { test } from 'node:test'
import { moonAppearance } from '../src/lib/moon.ts'

test('la luna conserva su aspecto normal cuando no hay condiciones especiales', () => {
  assert.equal(moonAppearance(1, false, 'clear'), 'normal')
  assert.equal(moonAppearance(1, false, 'storm'), 'normal')
})

test('el boss activo o la vida inferior al 30 % producen luna de sangre', () => {
  assert.equal(moonAppearance(1, true, 'clear'), 'blood')
  assert.equal(moonAppearance(0.29, false, 'clear'), 'blood')
})

test('la luna de sangre tiene prioridad sobre el eclipse', () => {
  assert.equal(moonAppearance(0.29, false, 'eclipse'), 'blood')
  assert.equal(moonAppearance(1, true, 'eclipse'), 'blood')
})

test('el eclipse cambia a luna gótica oscura mientras no haya luna de sangre', () => {
  assert.equal(moonAppearance(0.3, false, 'eclipse'), 'eclipse')
})
