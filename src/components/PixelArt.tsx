import { renderPixels } from '../lib/pixels'
import type { Palette } from '../lib/pixelArt'

interface PixelArtProps {
  rows: readonly string[]
  palette: Palette
  scale?: number
  className?: string
  title?: string
}

function PixelArt({ rows, palette, scale = 2, className, title }: Readonly<PixelArtProps>) {
  const width = rows[0]?.length ?? 0
  const height = rows.length
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      shapeRendering="crispEdges"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {renderPixels(rows, palette)}
    </svg>
  )
}

export default PixelArt
