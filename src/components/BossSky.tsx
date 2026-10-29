import type { Ref } from 'react'
import { GIANT_BAT, GIANT_BAT_PALETTE } from '../lib/pixelArt'
import Ornament from './Ornament'
import PixelArt from './PixelArt'

/**
 * Hueco transparente sobre el Castillo: al desplazar la página hacia arriba deja ver el cielo
 * y el castillo del fondo sin el HUD. El boss se dibuja sobre la luna del fondo.
 */
function BossSky({
  ref,
  bossActive,
  onOpenBoss,
  onReturn,
}: Readonly<{
  ref: Ref<HTMLDivElement>
  bossActive: boolean
  onOpenBoss: () => void
  onReturn: () => void
}>) {
  return (
    <div ref={ref} className="relative h-dvh min-h-[28rem]">
      <div className="absolute inset-x-0 top-[7dvh] flex flex-col items-center px-6 text-center">
        <Ornament className="w-44" />
        <h2 className="cv-sky-title mt-2 text-3xl">
          {bossActive ? 'Algo ronda la luna' : 'El cielo está en calma'}
        </h2>
        <p className="cv-shadow mt-2 max-w-72 font-body text-base text-silver-300 italic">
          {bossActive
            ? 'Toca al murciélago para conocer su amenaza.'
            : 'Ninguna criatura acecha el castillo esta noche.'}
        </p>
      </div>

      {bossActive && (
        <div className="cv-moon-spot pointer-events-none absolute flex h-28 w-28 items-center justify-center">
          <button
            type="button"
            onClick={onOpenBoss}
            aria-label="Murciélago gigante: ver detalles del encuentro"
            className="cv-boss-sprite pointer-events-auto shrink-0 rounded-3xl p-2"
          >
            <PixelArt rows={GIANT_BAT} palette={GIANT_BAT_PALETTE} scale={3} />
          </button>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <button type="button" onClick={onReturn} className="cv-btn cv-btn--gold">
          Volver a las tareas ▼
        </button>
      </div>
    </div>
  )
}

export default BossSky
