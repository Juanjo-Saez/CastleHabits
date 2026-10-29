import type { CSSProperties } from 'react'
import { BAT_A, BAT_B, BAT_PALETTE } from '../lib/pixelArt'
import { effectiveMaxHp } from '../lib/routes'
import { usePlayerStore } from '../store/usePlayerStore'
import CastleSilhouette from './CastleSilhouette'
import PixelArt from './PixelArt'

const BATS = [
  { top: '18%', duration: '19s', delay: '0s', scale: 3 },
  { top: '30%', duration: '26s', delay: '-9s', scale: 2 },
  { top: '12%', duration: '32s', delay: '-20s', scale: 2 },
]

function Backdrop() {
  const hpRatio = usePlayerStore((s) =>
    s.profile ? s.profile.hp / effectiveMaxHp(s.profile) : 1,
  )
  const bloodMoon = hpRatio < 0.3

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden cv-sky" aria-hidden>
      <div className="cv-stars absolute inset-0" />
      {/* Luna y castillo se anclan a la columna de la app para que el boss del Castillo coincida con la luna. */}
      <div className="absolute inset-0 mx-auto max-w-md">
        <div
          className={`cv-moon cv-moon-spot absolute h-28 w-28 ${bloodMoon ? 'cv-moon--blood' : ''}`}
        />
        <CastleSilhouette className="absolute inset-x-0 bottom-0 w-full" style={{ height: 'var(--castle-h)' }} />
      </div>

      {BATS.map((bat) => (
        <div
          key={bat.top}
          className="cv-bat"
          style={
            {
              top: bat.top,
              '--bat-duration': bat.duration,
              '--bat-delay': bat.delay,
            } as CSSProperties
          }
        >
          <div className="relative">
            <PixelArt rows={BAT_A} palette={BAT_PALETTE} scale={bat.scale} className="cv-bat-a" />
            <PixelArt rows={BAT_B} palette={BAT_PALETTE} scale={bat.scale} className="cv-bat-b" />
          </div>
        </div>
      ))}

      <div className="cv-fog absolute -left-1/4 bottom-0 h-48 w-[150%]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night-950 to-transparent" />
    </div>
  )
}

export default Backdrop
