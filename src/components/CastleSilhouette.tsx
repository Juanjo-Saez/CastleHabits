import type { CSSProperties } from 'react'

const NEAR = '#05040c'
const FAR = '#0c0e24'
const GROUND = 300

interface TowerSpec {
  cx: number
  w: number
  top: number
  /** Punta de la aguja; sin valor la torre acaba en almenas. */
  tip?: number
  needle?: boolean
  /** Alturas (y) de ventanas góticas iluminadas. */
  windows?: number[]
}

/** Torres del primer plano, de izquierda a derecha. La escena visible se centra en x = 25…235. */
const NEAR_TOWERS: TowerSpec[] = [
  { cx: 12, w: 14, top: 228, tip: 196 },
  { cx: 36, w: 16, top: 206, tip: 152, windows: [222] },
  { cx: 60, w: 12, top: 188, tip: 98, needle: true, windows: [206] },
  { cx: 83, w: 18, top: 176, tip: 124, windows: [194, 214] },
  { cx: 108, w: 14, top: 150, tip: 56, needle: true, windows: [170] },
  { cx: 156, w: 14, top: 146, tip: 62, needle: true, windows: [166] },
  { cx: 188, w: 12, top: 124, tip: 12, needle: true, windows: [146, 176] },
  { cx: 212, w: 18, top: 164, tip: 114, windows: [184, 206] },
  { cx: 237, w: 14, top: 192, tip: 152, windows: [210] },
  { cx: 254, w: 12, top: 216, tip: 190 },
]

const FAR_TOWERS: TowerSpec[] = [
  { cx: 24, w: 9, top: 190, tip: 128, needle: true },
  { cx: 48, w: 10, top: 160, tip: 90, needle: true },
  { cx: 72, w: 9, top: 140, tip: 62, needle: true },
  { cx: 98, w: 10, top: 130, tip: 70 },
  { cx: 168, w: 10, top: 120, tip: 40, needle: true },
  { cx: 200, w: 9, top: 130, tip: 72 },
  { cx: 226, w: 10, top: 150, tip: 84, needle: true },
  { cx: 250, w: 9, top: 180, tip: 126, needle: true },
]

/** Tramos de la torre central, de abajo arriba; solo el último lleva aguja. */
const KEEP_TIERS: TowerSpec[] = [
  { cx: 132, w: 34, top: 134 },
  { cx: 132, w: 24, top: 100 },
  { cx: 132, w: 16, top: 66, tip: 6, needle: true, windows: [84] },
]

function Window({ x, y }: Readonly<{ x: number; y: number }>) {
  return (
    <path
      d={`M${x} ${y + 6} V${y + 2} Q${x + 1.5} ${y - 1} ${x + 3} ${y + 2} V${y + 6} Z`}
      fill="#f5b54a"
      className="cv-window"
      style={{ animationDelay: `${-((x * 7 + y * 3) % 30) / 10}s` }}
    />
  )
}

function Tower({ cx, w, top, tip, needle, windows }: Readonly<TowerSpec>) {
  const x = cx - w / 2
  const merlons = Array.from({ length: Math.floor((w + 4) / 4) + 1 }, (_, i) => x - 2 + i * 4)
  const rise = tip === undefined ? 0 : top - 4 - tip
  return (
    <g>
      <rect x={x} y={top} width={w} height={GROUND - top + 2} />
      <rect x={x - 2} y={top - 4} width={w + 4} height={4} />
      {merlons.map((mx) => (
        <rect key={mx} x={mx} y={top - 7} width={2.2} height={3} />
      ))}
      {tip !== undefined && (
        <>
          <path
            d={needle
              ? `M${x - 1} ${top - 4} C${cx - 1.2} ${top - 4 - rise * 0.5} ${cx - 0.4} ${tip + rise * 0.2} ${cx} ${tip} C${cx + 0.4} ${tip + rise * 0.2} ${cx + 1.2} ${top - 4 - rise * 0.5} ${x + w + 1} ${top - 4} Z`
              : `M${x - 1.5} ${top - 4} L${cx} ${tip} L${x + w + 1.5} ${top - 4} Z`}
          />
          <rect x={cx - 0.6} y={tip - 6} width={1.2} height={6} />
          <rect x={cx - 1.8} y={tip - 4.5} width={3.6} height={1.2} />
          <path d={`M${x - 2} ${top - 4} L${x - 0.5} ${top - 13} L${x + 1.5} ${top - 4} Z`} />
          <path d={`M${x + w + 2} ${top - 4} L${x + w + 0.5} ${top - 13} L${x + w - 1.5} ${top - 4} Z`} />
        </>
      )}
      {windows?.map((wy) => <Window key={wy} x={cx - 1.5} y={wy} />)}
    </g>
  )
}

/** Silueta de castillo gótico de muchas torres y agujas, al estilo de los castillos clásicos de vampiros. */
function CastleSilhouette({ className, style }: Readonly<{ className?: string; style?: CSSProperties }>) {
  return (
    <svg
      viewBox="0 0 260 300"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      style={style}
      shapeRendering="crispEdges"
      aria-hidden
    >
      <g fill={FAR}>
        {FAR_TOWERS.map((tower) => <Tower key={tower.cx} {...tower} />)}
        <rect x="0" y="218" width="260" height="90" />
      </g>

      <g fill={NEAR}>
        <path d="M0 300 V262 Q40 246 90 256 Q150 238 200 252 Q235 244 260 254 V300 Z" />
        {NEAR_TOWERS.map((tower) => <Tower key={tower.cx} {...tower} />)}

        {/* Gran sala con frontón y rosetón */}
        <rect x="96" y="176" width="72" height="124" />
        <path d="M93 176 L132 146 L171 176 Z" />
        <rect x="110" y="170" width="3" height="14" />
        <rect x="151" y="168" width="3" height="16" />
        {KEEP_TIERS.map((tier) => <Tower key={tier.top} {...tier} />)}

        {/* Muralla con almenas y arbotantes */}
        <rect x="0" y="250" width="260" height="50" />
        {Array.from({ length: 33 }, (_, i) => (
          <rect key={i} x={i * 8 + 1} y="246" width="4" height="5" />
        ))}
        <path d="M70 188 Q96 214 100 196 L100 202 Q94 228 68 196 Z" />
        <path d="M164 190 Q176 214 186 200 L186 206 Q174 228 162 198 Z" />
        <path d="M120 150 Q132 160 144 150 L144 156 Q132 168 120 156 Z" />
      </g>

      <g fill="#f5b54a" opacity="0.7" className="cv-window">
        <circle cx="132" cy="196" r="5.5" />
      </g>
      <g fill={NEAR}>
        <rect x="131" y="190" width="2" height="12" />
        <rect x="126" y="195" width="12" height="2" />
      </g>
      {[[104, 222], [120, 222], [140, 222], [156, 222], [112, 254], [150, 254], [24, 262], [220, 258]].map(([x, y]) => (
        <Window key={`${x}-${y}`} x={x} y={y} />
      ))}
    </svg>
  )
}

export default CastleSilhouette
