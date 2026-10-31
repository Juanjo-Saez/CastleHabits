import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { moonAppearance } from '../src/lib/moon.ts'

const moonAssetPath = join(process.cwd(), 'src', 'assets', 'moon.png')
const moonAsset = readFileSync(moonAssetPath)

test('el arte de luna es una imagen PNG transparente de tamaño optimizado', () => {
  assert.equal(moonAsset.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(moonAsset.readUInt32BE(16), 320)
  assert.equal(moonAsset.readUInt32BE(20), 320)
  assert.equal(moonAsset[24], 8)
  assert.equal(moonAsset[25], 6, 'PNG RGBA')
  assert.ok(statSync(moonAssetPath).size < 200_000)
})

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
