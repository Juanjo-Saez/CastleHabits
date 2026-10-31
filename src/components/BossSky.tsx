import type { Ref } from 'react'
import { BOSSES } from '../lib/bosses'
import { todayKey } from '../lib/date'
import { weatherForDay, weatherProfile } from '../lib/weather'
import type { BossId } from '../types'
import BossSprite from './BossSprite'
import Ornament from './Ornament'

/**
 * Hueco transparente sobre el Castillo: al desplazar la página hacia arriba deja ver el cielo
 * y el castillo del fondo sin el HUD. El boss se dibuja sobre la luna del fondo.
 */
function BossSky({
  ref,
  bossId,
  onOpenBoss,
  onReturn,
  entrancePhase,
  onSkipEntrance,
}: Readonly<{
  ref: Ref<HTMLDivElement>
  bossId: BossId | null
  onOpenBoss: () => void
  onReturn: () => void
  entrancePhase?: 'revealing'
  onSkipEntrance?: () => void
}>) {
  const revealing = entrancePhase === 'revealing'
  const storming = Boolean(bossId)
  const weather = weatherProfile(weatherForDay(todayKey()))

  return (
    <div
      ref={ref}
      className={`cv-castle-snap-stop relative h-dvh min-h-[28rem] ${revealing ? 'cv-boss-sky--revealing' : ''}`}
    >
      {storming && (
        <div className={`cv-boss-lightning ${revealing ? '' : 'cv-boss-lightning--persistent'}`} aria-hidden>
          <span />
          <span />
        </div>
      )}
      <div className="absolute inset-x-0 top-[7dvh] flex flex-col items-center px-6 text-center">
        <Ornament className="w-44" />
        <h2 className="cv-sky-title mt-2 text-3xl" aria-live="polite">
          {revealing ? 'El cielo se quiebra' : bossId ? 'Algo ronda la luna' : 'El cielo está en calma'}
        </h2>
        <p className="cv-shadow mt-2 max-w-72 font-body text-base text-silver-300 italic" role="status">
          {revealing
            ? `Una presencia irrumpe en el Castillo: ${bossId ? BOSSES[bossId].name : 'algo desconocido'}.`
            : bossId
            ? 'Toca a la criatura para conocer su amenaza.'
            : `${weather.description} Ninguna criatura acecha el castillo esta noche.`}
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0 mx-auto max-w-md">
        {bossId && (
          <div className="cv-moon-spot pointer-events-none absolute flex h-[72px] w-[72px] items-center justify-center">
            <button
              type="button"
              onClick={onOpenBoss}
              disabled={revealing}
              aria-label={`${BOSSES[bossId].name}: ver detalles del encuentro`}
              className="cv-boss-sprite pointer-events-auto shrink-0 rounded-3xl p-2"
            >
              <BossSprite bossId={bossId} scale={3} />
            </button>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3">
        {revealing && onSkipEntrance && (
          <button type="button" onClick={onSkipEntrance} className="cv-btn cv-btn--ghost">
            Omitir aparición
          </button>
        )}
        <button type="button" onClick={onReturn} className="cv-btn cv-btn--gold">
          Volver a las tareas ▼
        </button>
      </div>
    </div>
  )
}

export default BossSky
