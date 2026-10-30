import type { CSSProperties } from 'react'
import castleArt from '../assets/castle.png'
import { CASTLE_ART, castleArtGeometry } from '../lib/castleArt'

/**
 * Castillo pixel-art sin cielo ni luna: se apoya en el borde inferior, conserva su
 * proporción y recorta los laterales alrededor de la torre central cuando falta anchura.
 */
function CastleSilhouette({ className, style }: Readonly<{ className?: string; style?: CSSProperties }>) {
  return (
    <div
      className={`cv-castle-scene ${className ?? ''}`}
      style={{ ...(castleArtGeometry() as CSSProperties), ...style }}
      aria-hidden
    >
      <img
        src={castleArt}
        alt=""
        width={CASTLE_ART.width}
        height={CASTLE_ART.height}
        draggable={false}
        decoding="async"
        className="cv-castle-scene__art"
      />
    </div>
  )
}

export default CastleSilhouette
