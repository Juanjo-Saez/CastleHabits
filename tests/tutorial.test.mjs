import assert from 'node:assert/strict'
import { test } from 'node:test'
import { tutorialCompletionPreview } from '../src/lib/tutorialPreview.ts'

test('la vista previa suma EXP y monedas sin modificar el perfil original', () => {
  const profile = { level: 1, xp: 70, coins: 3 }
  const preview = tutorialCompletionPreview(profile, 10, 2)

  assert.deepEqual(preview.before, { level: 1, xp: 70, coins: 3 })
  assert.deepEqual(preview.after, { level: 2, xp: 5, coins: 5 })
  assert.deepEqual(profile, { level: 1, xp: 70, coins: 3 })
})
