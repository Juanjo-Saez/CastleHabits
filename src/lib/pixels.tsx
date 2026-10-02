import type { ReactElement } from 'react'
import type { Palette } from './pixelArt'

/** Convierte filas de pixel art en <rect>, fusionando píxeles contiguos del mismo color. */
export function renderPixels(
  rows: readonly string[],
  palette: Palette,
  offsetY = 0,
): ReactElement[] {
  const rects: ReactElement[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      const color = palette[ch]
      if (!color) {
        x += 1
        continue
      }
      let run = 1
      while (x + run < row.length && row[x + run] === ch) run += 1
      rects.push(
        <rect
          key={`${y}-${x}`}
          x={x}
          y={y + offsetY}
          width={run}
          height={1}
          fill={color}
        />,
      )
      x += run
    }
  })
  return rects
}
