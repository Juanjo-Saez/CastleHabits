import Candle from './Candle'

const MAX_INDIVIDUAL_CANDLES = 6

function CandleCount({ lit, count }: Readonly<{ lit: boolean; count: number }>) {
  return (
    <span className="flex min-w-0 items-center gap-px">
      <Candle lit={lit} scale={0.55} />
      <span className="font-pixel text-[7px] leading-none text-silver-300">×{count}</span>
    </span>
  )
}

/** Mantiene una huella estable: hasta seis velas, o contadores separados por estado. */
function CandleStack({ lit, unlit }: Readonly<{ lit: number; unlit: number }>) {
  const total = lit + unlit
  if (total === 0) return <span className="block h-[9px]" aria-hidden />

  if (total > MAX_INDIVIDUAL_CANDLES) {
    return (
      <span className="flex h-[9px] w-full items-center justify-center gap-1 overflow-hidden">
        {lit > 0 && <CandleCount lit count={lit} />}
        {unlit > 0 && <CandleCount lit={false} count={unlit} />}
      </span>
    )
  }

  const candles = [
    ...Array.from({ length: lit }, (_, i) => ({ id: `lit-${i}`, lit: true })),
    ...Array.from({ length: unlit }, (_, i) => ({ id: `unlit-${i}`, lit: false })),
  ]
  return (
    <span className="flex h-[9px] w-full items-center justify-center gap-px overflow-hidden">
      {candles.map((candle) => (
        <Candle key={candle.id} lit={candle.lit} scale={0.55} />
      ))}
    </span>
  )
}

export default CandleStack
