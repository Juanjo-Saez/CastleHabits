import { usePlayerStore } from '../store/usePlayerStore'
import { restartExpedition } from '../store/routeActions'

function HardcoreDeath() {
  const profile = usePlayerStore((s) => s.profile)

  if (!profile?.dead) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/95 px-6">
      <div className="cv-panel cv-panel--blood w-full max-w-sm p-6 text-center">
        <p className="cv-label text-blood-400">Fin de la partida</p>
        <h2 className="cv-title mt-3 text-5xl">Has caído</h2>
        <p className="mt-3 font-body text-lg text-silver-300 italic">
          El cazador ha perdido toda su vitalidad. La próxima expedición comienza desde cero.
        </p>
        <button
          type="button"
          onClick={() => void restartExpedition()}
          className="cv-btn cv-btn--gold mt-6 w-full"
        >
          Renacer en el nivel 1
        </button>
      </div>
    </div>
  )
}

export default HardcoreDeath