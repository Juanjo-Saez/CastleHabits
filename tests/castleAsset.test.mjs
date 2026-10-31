import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

const root = process.cwd()
const assetPath = join(root, 'src', 'assets', 'castle-scene.webp')
const referencePath = join(root, 'art', 'references', 'castle-scene-reference.png')
const asset = readFileSync(assetPath)
const reference = readFileSync(referencePath)

test('la escena completa está optimizada y conserva las dimensiones de referencia', () => {
  assert.equal(reference.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'firma PNG')
  assert.equal(reference.readUInt32BE(16), 1367)
  assert.equal(reference.readUInt32BE(20), 768)
  assert.equal(asset.toString('ascii', 0, 4), 'RIFF')
  assert.equal(asset.toString('ascii', 8, 12), 'WEBP')
  assert.ok(statSync(assetPath).size < 1_000_000, 'la escena se precachea en la PWA')
  assert.ok(!existsSync(join(root, 'src', 'assets', 'castle.png')), 'no queda el recorte anterior')
  assert.ok(!existsSync(join(root, 'scripts', 'extract-castle.py')), 'no queda el extractor anterior')
})

test('la escena completa es decorativa y conserva la luna y el clima como capas independientes', () => {
  const component = readFileSync(join(root, 'src', 'components', 'CastleSilhouette.tsx'), 'utf8')
  const backdrop = readFileSync(join(root, 'src', 'components', 'Backdrop.tsx'), 'utf8')
  const moon = readFileSync(join(root, 'src', 'components', 'Moon.tsx'), 'utf8')
  const bossSky = readFileSync(join(root, 'src', 'components', 'BossSky.tsx'), 'utf8')
  const styles = readFileSync(join(root, 'src', 'index.css'), 'utf8')

  assert.match(component, /castle-scene\.webp/)
  assert.match(component, /aria-hidden/)
  assert.match(backdrop, /<CastleSilhouette className="absolute inset-0 z-0"/)
  assert.match(backdrop, /<Moon/)
  assert.match(backdrop, /h-20 w-20/)
  assert.match(backdrop, /cv-cloud-layer/)
  assert.match(backdrop, /cv-rain-layer/)
  assert.match(backdrop, /cv-weather-haze/)
  assert.match(moon, /from '..\/assets\/moon\.png'/)
  assert.ok(moon.includes('width={320}'))
  assert.match(moon, /aria-hidden="true"/)
  assert.match(bossSky, /h-20 w-20/)
  assert.match(styles, /image-rendering:\s*pixelated/)
  assert.match(styles, /object-fit:\s*cover/)
  assert.match(styles, /object-position:\s*55% center/)
  assert.match(styles, /\.cv-moon--blood/)
  assert.match(styles, /\.cv-moon--eclipse/)
  assert.doesNotMatch(styles, /0 0 120px/)
})

test('el encabezado del diálogo reutiliza la luna pixel-art sobre la composición', () => {
  const dialog = readFileSync(join(root, 'src', 'components', 'BossDialog.tsx'), 'utf8')
  const sceneIndex = dialog.indexOf('<CastleSilhouette className="absolute inset-0 opacity-95"')
  const moonIndex = dialog.indexOf('<Moon', sceneIndex)

  assert.ok(sceneIndex >= 0)
  assert.ok(moonIndex > sceneIndex)
  assert.match(dialog, /h-\[72px\] w-\[72px\] -translate-x-1\/2/)
  assert.match(dialog, /appearance={appearance}/)
})

test('las referencias se conservan fuera de la carpeta pública', () => {
  for (const name of ['castle-reference.png', 'castle-scene-reference.png', 'loading-reference.png', 'moon-reference.png']) {
    assert.ok(existsSync(join(root, 'art', 'references', name)), name)
  }
  const published = readdirSync(join(root, 'public'), { recursive: true }).map(String)
  assert.ok(!published.some((file) => file.includes('reference')), 'no se publican ni precachean')
})
