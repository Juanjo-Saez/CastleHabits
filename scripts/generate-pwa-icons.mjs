import { writeFile } from 'node:fs/promises'
import { deflateSync } from 'node:zlib'

const palette = {
  background: [11, 16, 51, 255],
  red: [216, 40, 63, 255],
  orange: [255, 159, 46, 255],
  cream: [255, 244, 194, 255],
  shadow: [26, 18, 8, 255],
  candle: [239, 228, 200, 255],
  shade: [185, 169, 135, 255],
  gold: [201, 162, 75, 255],
  darkGold: [143, 114, 40, 255],
}

const rectangles = [
  [7, 3, 2, 1, 'red'],
  [6, 4, 4, 2, 'orange'],
  [7, 4, 2, 2, 'cream'],
  [7, 6, 2, 1, 'shadow'],
  [6, 7, 4, 4, 'candle'],
  [9, 7, 1, 4, 'shade'],
  [4, 11, 8, 1, 'gold'],
  [7, 12, 2, 1, 'darkGold'],
  [5, 13, 6, 1, 'gold'],
]

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(name, data) {
  const type = Buffer.from(name)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([type, data])))
  return Buffer.concat([length, type, data, checksum])
}

function renderPng(size) {
  const scale = size / 16
  const pixels = Buffer.alloc(size * size * 4)
  for (let offset = 0; offset < pixels.length; offset += 4) {
    palette.background.forEach((value, channel) => { pixels[offset + channel] = value })
  }

  for (const [x, y, width, height, colorName] of rectangles) {
    const color = palette[colorName]
    for (let row = y * scale; row < (y + height) * scale; row += 1) {
      for (let column = x * scale; column < (x + width) * scale; column += 1) {
        const offset = (row * size + column) * 4
        color.forEach((value, channel) => { pixels[offset + channel] = value })
      }
    }
  }

  const scanlines = Buffer.alloc(size * (size * 4 + 1))
  for (let row = 0; row < size; row += 1) {
    pixels.copy(scanlines, row * (size * 4 + 1) + 1, row * size * 4, (row + 1) * size * 4)
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 6

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

await writeFile(new URL('../public/icon-192.png', import.meta.url), renderPng(192))
await writeFile(new URL('../public/icon-512.png', import.meta.url), renderPng(512))