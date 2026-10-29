import { GIANT_BAT, GIANT_BAT_PALETTE } from '../lib/pixelArt'
import type { BossSummary } from '../lib/bosses'
import PixelArt from './PixelArt'

/** Tarjeta persistente del Castillo mientras el boss está activo. */
function BossBanner({ summary, onOpen }: Readonly<{ summary: BossSummary; onOpen: () => void }>) {
  const { definition, completedDates, target, daysLeft } = summary
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${definition.name}: ${completedDates.length} de ${target} días conseguidos. Ver detalles`}
      className="cv-panel cv-panel--blood relative flex w-full items-center gap-2 overflow-hidden px-2 py-2 text-left"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-6 -left-6 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgb(236_229_198/0.28),transparent_70%)]"
      />
      <PixelArt rows={GIANT_BAT} palette={GIANT_BAT_PALETTE} scale={2} className="cv-boss-float relative shrink-0" />
      <span className="relative min-w-0 flex-1">
        <span className="cv-label block text-blood-400">Boss · {daysLeft === 1 ? 'último día' : `quedan ${daysLeft} días`}</span>
        <span className="cv-title mt-1 block text-2xl">{definition.name}</span>
        <span className="mt-1 flex items-center gap-2">
          <span className="flex gap-1" aria-hidden>
            {Array.from({ length: target }, (_, index) => (
              <span
                key={index}
                className={`h-3 w-5 border ${index < completedDates.length ? 'border-gold-300 bg-gold-400' : 'border-silver-700 bg-night-950'}`}
              />
            ))}
          </span>
          <span className="font-pixel text-lg leading-none text-silver-300">
            {completedDates.length}/{target} días · EXP −{100 - definition.xpPercent}%
          </span>
        </span>
      </span>
    </button>
  )
}

export default BossBanner
