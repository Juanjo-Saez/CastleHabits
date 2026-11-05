import type { BossId, DraculaPhase } from '../types'
import { DRACULA_PHASE_LABELS } from '../lib/bosses'
import {
  CERBERUS,
  CERBERUS_PALETTE,
  DOPPELGANGER,
  DOPPELGANGER_PALETTE,
  GAIBON,
  GAIBON_PALETTE,
  FRANKENSTEIN,
  FRANKENSTEIN_PALETTE,
  GIANT_BAT,
  GIANT_BAT_PALETTE,
  HYDRA,
  HYDRA_PALETTE,
  LEGION,
  LEGION_PALETTE,
  MEDUSA,
  MEDUSA_PALETTE,
  SLOGRA,
  SLOGRA_PALETTE,
  SUCCUBUS,
  SUCCUBUS_PALETTE,
} from '../lib/pixelArt'
import PixelArt from './PixelArt'

const DRACULA_PHASE_IMAGES: Record<DraculaPhase, string> = {
  human: '/images/dracula-human.webp',
  bat: '/images/dracula-bat.jpg',
  demon: '/images/dracula-demon.webp',
}

/** Dibujo de cada boss; los de dos partes se componen en una sola escena. */
function BossSprite({
  bossId,
  scale = 3,
  className = '',
  phase,
}: Readonly<{ bossId: BossId; scale?: number; className?: string; phase?: DraculaPhase }>) {
  if (bossId === 'dracula') {
    const currentPhase = phase ?? 'human'
    return (
      <span
        role="img"
        aria-label={`Drácula · fase ${DRACULA_PHASE_LABELS[currentPhase]}`}
        className={`cv-plate flex shrink-0 items-center justify-center overflow-hidden border border-blood-500/60 p-1 ${className}`}
        style={{ width: 44 * scale, height: 48 * scale }}
      >
        <img src={DRACULA_PHASE_IMAGES[currentPhase]} alt="" className="h-full w-full object-contain" />
      </span>
    )
  }
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
  if (bossId === 'medusa') {
    return <PixelArt rows={MEDUSA} palette={MEDUSA_PALETTE} scale={scale} className={`shrink-0 ${className}`} />
  }
  if (bossId === 'cerberus') {
    return <PixelArt rows={CERBERUS} palette={CERBERUS_PALETTE} scale={scale} className={`shrink-0 ${className}`} />
  }
  if (bossId === 'hydra-scylla') {
    return <PixelArt rows={HYDRA} palette={HYDRA_PALETTE} scale={scale} className={`shrink-0 ${className}`} />
  }
  if (bossId === 'doppelganger') {
    return <PixelArt rows={DOPPELGANGER} palette={DOPPELGANGER_PALETTE} scale={scale} className={`shrink-0 ${className}`} />
  }
  if (bossId === 'sukamon') {
    return (
      <img
        src="/images/sukamon-portrait.png"
        alt="Sukamon"
        className={`shrink-0 object-contain ${className}`}
        style={{ width: 32 * scale, height: 24 * scale }}
      />
    )
  }
  return <PixelArt rows={GIANT_BAT} palette={GIANT_BAT_PALETTE} scale={scale} className={`shrink-0 ${className}`} />
}

export default BossSprite
