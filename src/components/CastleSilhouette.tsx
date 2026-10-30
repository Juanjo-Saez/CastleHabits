import type { CSSProperties } from 'react'
import castleScene from '../assets/castle-scene.webp'

function CastleSilhouette({ className, style }: Readonly<{ className?: string; style?: CSSProperties }>) {
  return (
    <div
      className={`cv-castle-scene ${className ?? ''}`}
      style={style}
      aria-hidden
    >
      <img
        src={castleScene}
        alt=""
        width={1367}
        height={768}
        draggable={false}
        decoding="async"
        className="cv-castle-scene__art"
      />
    </div>
  )
}

export default CastleSilhouette
