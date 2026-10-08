import type { CSSProperties } from 'react'
import { BAT_A, BAT_B, BAT_PALETTE } from '../lib/pixelArt'
import { effectiveMaxHp } from '../lib/routes'
import { usePlayerStore } from '../store/usePlayerStore'
import PixelArt from './PixelArt'

const BATS = [
  { top: '18%', duration: '19s', delay: '0s', scale: 3 },
  { top: '30%', duration: '26s', delay: '-9s', scale: 2 },
  { top: '12%', duration: '32s', delay: '-20s', scale: 2 },
]

const WINDOWS = [
  { x: 186, y: 92, delay: '0s' },
  { x: 211, y: 92, delay: '-1.2s' },
  { x: 198, y: 118, delay: '-0.6s' },
  { x: 249, y: 62, delay: '-2s' },
  { x: 249, y: 92, delay: '-0.3s' },
  { x: 121, y: 106, delay: '-1.7s' },
  { x: 338, y: 112, delay: '-0.9s' },
]

function CastleSilhouette() {
  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-x-0 bottom-0 h-[38vh] w-full"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <g fill="#06050e">
        <path d="M0 200 L0 172 Q60 150 120 162 Q200 142 280 160 Q340 150 400 166 L400 200 Z" />
        <rect x="60" y="120" width="18" height="50" />
        <polygon points="56,120 69,98 82,120" />
        <rect x="78" y="132" width="92" height="38" />
        {[78, 90, 102, 114, 126, 138, 150, 162].map((x) => (
          <rect key={`wl-${x}`} x={x} y="126" width="6" height="6" />
        ))}
        <rect x="110" y="90" width="26" height="80" />
        <polygon points="105,90 123,56 141,90" />
        <rect x="170" y="70" width="60" height="100" />
        <polygon points="164,70 200,28 236,70" />
        <rect x="240" y="40" width="22" height="130" />
        <polygon points="235,40 251,0 267,40" />
        <rect x="262" y="112" width="70" height="58" />
        {[262, 274, 286, 298, 310, 322].map((x) => (
          <rect key={`wr-${x}`} x={x} y="106" width="6" height="6" />
        ))}
        <rect x="330" y="95" width="20" height="75" />
        <polygon points="326,95 340,68 354,95" />
      </g>
      {WINDOWS.map((w) => (
        <rect
          key={`${w.x}-${w.y}`}
          x={w.x}
          y={w.y}
          width="3"
          height="5"
          fill="#f5b54a"
          className="cv-window"
          style={{ animationDelay: w.delay }}
        />
      ))}
    </svg>
  )
}

function Backdrop() {
  const hpRatio = usePlayerStore((s) =>
    s.profile ? s.profile.hp / effectiveMaxHp(s.profile) : 1,
  )
  const bloodMoon = hpRatio < 0.3

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden cv-sky" aria-hidden>
      <div className="cv-stars absolute inset-0" />
      <div
        className={`cv-moon absolute top-16 right-[8%] h-28 w-28 ${bloodMoon ? 'cv-moon--blood' : ''}`}
      />

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

      <CastleSilhouette />
      <div className="cv-fog absolute -left-1/4 bottom-0 h-48 w-[150%]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night-950 to-transparent" />
    </div>
  )
}

export default Backdrop
