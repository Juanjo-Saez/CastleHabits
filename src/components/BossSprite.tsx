import type { BossId } from '../types'
import {
  GAIBON,
  GAIBON_PALETTE,
  FRANKENSTEIN,
  FRANKENSTEIN_PALETTE,
  GIANT_BAT,
  GIANT_BAT_PALETTE,
  LEGION,
  LEGION_PALETTE,
  SLOGRA,
  SLOGRA_PALETTE,
  SUCCUBUS,
  SUCCUBUS_PALETTE,
} from '../lib/pixelArt'
import PixelArt from './PixelArt'

/** Dibujo de cada boss; los de dos partes se componen en una sola escena. */
function BossSprite({ bossId, scale = 3, className = '' }: Readonly<{ bossId: BossId; scale?: number; className?: string }>) {
  if (bossId === 'slogra-gaibon') {
    return (
      <span
        className={`relative inline-block shrink-0 ${className}`}
        style={{ width: 58 * scale, height: 36 * scale }}
        aria-hidden
      >
        <PixelArt rows={SLOGRA} palette={SLOGRA_PALETTE} scale={scale} className="absolute bottom-0 left-0" />
        <PixelArt rows={GAIBON} palette={GAIBON_PALETTE} scale={scale} className="absolute top-0 right-0" />
      </span>
    )
  }
  if (bossId === 'legion') {
    return <PixelArt rows={LEGION} palette={LEGION_PALETTE} scale={scale} className={`shrink-0 ${className}`} />
  }
  if (bossId === 'frankenstein') {
    return <PixelArt rows={FRANKENSTEIN} palette={FRANKENSTEIN_PALETTE} scale={scale} className={`shrink-0 ${className}`} />
  }
  if (bossId === 'succubus') {
    return <PixelArt rows={SUCCUBUS} palette={SUCCUBUS_PALETTE} scale={scale} className={`shrink-0 ${className}`} />
  }
  return <PixelArt rows={GIANT_BAT} palette={GIANT_BAT_PALETTE} scale={scale} className={`shrink-0 ${className}`} />
}

export default BossSprite
