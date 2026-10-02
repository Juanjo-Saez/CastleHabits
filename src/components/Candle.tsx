import { renderPixels } from '../lib/pixels'
import { CANDLE_BODY, CANDLE_FLAME, CANDLE_PALETTE } from '../lib/pixelArt'

function Candle({ lit, scale = 3 }: Readonly<{ lit: boolean; scale?: number }>) {
  return (
    <svg
      viewBox="0 0 9 16"
      width={9 * scale}
      height={16 * scale}
      shapeRendering="crispEdges"
      aria-hidden
      className={
        lit
          ? 'drop-shadow-[0_0_8px_rgba(255,159,46,0.85)]'
          : 'opacity-80 grayscale-[0.4]'
      }
    >
      {lit && <g className="cv-flicker">{renderPixels(CANDLE_FLAME, CANDLE_PALETTE)}</g>}
      {renderPixels(CANDLE_BODY, CANDLE_PALETTE, 6)}
    </svg>
  )
}

export default Candle
