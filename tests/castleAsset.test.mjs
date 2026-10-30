import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { inflateSync } from 'node:zlib'
import { CASTLE_ART, castleArtGeometry } from '../src/lib/castleArt.ts'

// Los tests se empaquetan en una carpeta temporal: las rutas parten de la raíz del proyecto.
const root = process.cwd()
const ASSET = join(root, 'src', 'assets', 'castle.png')
const MOON = { x: 451, y: 89, r: 40 }

/** Decodifica un PNG indexado de 8 bits y devuelve el alfa de cada píxel. */
function decodeIndexedPng(buffer) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'firma PNG')
  let offset = 8
  let header
  let transparency = new Uint8Array()
  const data = []
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const chunk = buffer.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      header = {
        width: chunk.readUInt32BE(0),
        height: chunk.readUInt32BE(4),
        bitDepth: chunk[8],
        colorType: chunk[9],
        interlace: chunk[12],
      }
    } else if (type === 'tRNS') {
      transparency = new Uint8Array(chunk)
    } else if (type === 'IDAT') {
      data.push(chunk)
    }
    offset += 12 + length
  }
  assert.equal(header.colorType, 3, 'paleta indexada')
  assert.equal(header.bitDepth, 8)
  assert.equal(header.interlace, 0)

  const raw = inflateSync(Buffer.concat(data))
  const { width, height } = header
  const indices = new Uint8Array(width * height)
  let previous = new Uint8Array(width)
  for (let y = 0; y < height; y += 1) {
    const start = y * (width + 1)
    const filter = raw[start]
    const row = new Uint8Array(width)
    for (let x = 0; x < width; x += 1) {
      const value = raw[start + 1 + x]
      const left = x > 0 ? row[x - 1] : 0
      const up = previous[x]
      const upLeft = x > 0 ? previous[x - 1] : 0
      let predictor = 0
      if (filter === 1) predictor = left
      else if (filter === 2) predictor = up
      else if (filter === 3) predictor = (left + up) >> 1
      else if (filter === 4) {
        const estimate = left + up - upLeft
        const [a, b, c] = [Math.abs(estimate - left), Math.abs(estimate - up), Math.abs(estimate - upLeft)]
        predictor = a <= b && a <= c ? left : b <= c ? up : upLeft
      }
      row[x] = (value + predictor) & 0xff
    }
    indices.set(row, y * width)
    previous = row
  }
  const alpha = (x, y) => {
    const index = indices[y * width + x]
    return index < transparency.length ? transparency[index] : 255
  }
  return { ...header, alpha }
}

const art = decodeIndexedPng(readFileSync(ASSET))

test('el castillo pixel-art mantiene las dimensiones declaradas y un peso contenido', () => {
  assert.equal(art.width, CASTLE_ART.width)
  assert.equal(art.height, CASTLE_ART.height)
  assert.ok(readFileSync(ASSET).length < 120_000, 'el asset se precachea en la PWA')
})

test('el asset no incluye cielo, luna ni montañas pintadas', () => {
  for (let y = MOON.y - MOON.r; y <= MOON.y + MOON.r; y += 4) {
    for (let x = MOON.x - MOON.r; x <= MOON.x + MOON.r; x += 4) {
      const inside = (x - MOON.x) ** 2 + (y - MOON.y) ** 2 <= MOON.r ** 2
      // La aguja y la torreta de la torre central pasan por delante de la luna original.
      const spire = x >= 436 && x <= 490 && y >= 70
      if (inside && !spire) assert.equal(art.alpha(x, y), 0, `luna en ${x},${y}`)
    }
  }
  for (const [x, y] of [[0, 0], [737, 0], [40, 120], [700, 200], [60, 320], [680, 320]]) {
    assert.equal(art.alpha(x, y), 0, `cielo o montaña en ${x},${y}`)
  }
  for (let y = 0; y < CASTLE_ART.horizon; y += 2) {
    for (let x = 0; x < CASTLE_ART.width; x += 2) {
      if (x < 270 || x > 548) assert.equal(art.alpha(x, y), 0, `fuera del castillo en ${x},${y}`)
    }
  }
})

test('la torre central y el suelo son opacos y la torre queda en el eje de recorte', () => {
  for (const [x, y] of [[440, 200], [420, 300], [320, 290], [CASTLE_ART.focusX, 330]]) {
    assert.equal(art.alpha(x, y), 255, `castillo en ${x},${y}`)
  }
  for (let x = 0; x < CASTLE_ART.width; x += 6) {
    assert.equal(art.alpha(x, CASTLE_ART.height - 1), 255, `suelo en ${x}`)
    assert.equal(art.alpha(x, CASTLE_ART.horizon), 255, `horizonte en ${x}`)
  }
  let top = CASTLE_ART.height
  for (let y = 0; y < CASTLE_ART.height && top === CASTLE_ART.height; y += 1) {
    for (let x = 300; x <= 520; x += 1) {
      if (art.alpha(x, y)) {
        top = y
        break
      }
    }
  }
  assert.ok(top > 40 && top < 90, `la aguja más alta empieza en la fila ${top}`)
})

test('la geometría CSS se deriva del asset', () => {
  assert.deepEqual(castleArtGeometry(), {
    '--castle-focus': '55.2846%',
    '--castle-ground': '17.6329%',
  })
})

test('las referencias originales se conservan fuera de la carpeta pública', () => {
  for (const name of ['castle-reference.png', 'loading-reference.png']) {
    assert.ok(existsSync(join(root, 'art', 'references', name)), name)
  }
  const published = readdirSync(join(root, 'public'), { recursive: true }).map(String)
  assert.ok(!published.some((file) => file.includes('reference')), 'no se publican ni precachean')
})
