import Candle from './Candle'

const MAX_INDIVIDUAL_CANDLES = 6
const MAX_LARGE_CANDLES = 3

/** Hasta 6 velas pequeñas; a partir de 7 se agrupan en una sola vela con contador. */
function CandleStack({ lit, unlit }: Readonly<{ lit: number; unlit: number }>) {
  const total = lit + unlit
  if (total === 0) return null

  if (total > MAX_INDIVIDUAL_CANDLES) {
    return (
      <span className="flex items-center gap-0.5">
        <Candle lit={lit > 0} scale={2} />
        <span className="font-pixel text-base leading-none text-silver-300">×{total}</span>
      </span>
    )
  }

  const scale = total <= MAX_LARGE_CANDLES ? 2 : 1

  const candles = [
    ...Array.from({ length: lit }, (_, i) => ({ id: `lit-${i}`, lit: true })),
    ...Array.from({ length: unlit }, (_, i) => ({ id: `unlit-${i}`, lit: false })),
  ]
  return (
    <span className="flex flex-wrap items-end justify-center gap-px">
      {candles.map((candle) => (
        <Candle key={candle.id} lit={candle.lit} scale={scale} />
      ))}
    </span>
  )
}

export default CandleStack
