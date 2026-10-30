import { describeEffect, encounterSummaryLine, type BossSummary } from '../lib/bosses'
import BossSprite from './BossSprite'

/** Tarjeta persistente del Castillo mientras el boss está activo. */
function BossBanner({ summary, onOpen }: Readonly<{ summary: BossSummary; onOpen: () => void }>) {
  const { definition, kind, bars, completedDates, target, daysLeft, damage } = summary
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${definition.name}: ${encounterSummaryLine(summary)}. Ver detalles`}
      className="cv-panel cv-panel--blood relative flex w-full items-center gap-2 overflow-hidden px-2 py-2 text-left"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-6 -left-6 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgb(236_229_198/0.28),transparent_70%)]"
      />
      <BossSprite bossId={definition.id} scale={2} className="cv-boss-float relative" />
      <span className="relative min-w-0 flex-1">
        <span className="cv-label block text-blood-400">Boss · {daysLeft === 1 ? 'último día' : `quedan ${daysLeft} días`}</span>
        <span className="cv-title mt-1 block text-2xl">{definition.name}</span>
        {kind === 'days' ? (
          <span className="mt-1 flex items-center gap-2">
            <span className="flex gap-1" aria-hidden>
              {Array.from({ length: target }, (_, index) => (
                <span
                  key={index}
                  className={`h-3 w-5 border ${index < completedDates.length ? 'border-gold-300 bg-gold-400' : 'border-silver-700 bg-night-950'}`}
                />
              ))}
            </span>
            <span className="font-pixel text-lg leading-none text-silver-300">{completedDates.length}/{target} días</span>
          </span>
        ) : (
          <span key={damage} className="cv-boss-hit mt-1 flex flex-col gap-1" aria-hidden>
            {bars.map((bar) => (
              <span key={bar.name} className="flex items-center gap-2">
                <span className="w-14 shrink-0 font-pixel text-base leading-none text-silver-300">{bar.name}</span>
                <span className="cv-bar !h-2.5 flex-1">
                  <span className="cv-fill-hp" style={{ width: `${bar.max ? (bar.hp / bar.max) * 100 : 0}%` }} />
                </span>
                <span className="w-10 shrink-0 text-right font-pixel text-base leading-none text-silver-100">{bar.hp}</span>
              </span>
            ))}
          </span>
        )}
        <span className="cv-label mt-1 block text-[0.8rem] text-silver-500">
          {definition.effects.map(describeEffect).join(' · ')}
        </span>
      </span>
    </button>
  )
}

export default BossBanner
