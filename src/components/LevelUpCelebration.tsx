import { useEffect } from 'react'
import { getAvatarStage } from '../lib/gamification'
import { playLevelUpChime } from '../lib/sound'
import { useDailySummaryStore } from '../store/useDailySummaryStore'
import { usePlayerStore } from '../store/usePlayerStore'

const DISPLAY_MS = 9000

/** Celebración no bloqueante: deja la navegación y los controles accesibles mientras está visible. */
function LevelUpCelebration() {
  const levelUp = usePlayerStore((s) => s.justLeveledUp)
  const clearLevelUp = usePlayerStore((s) => s.clearLevelUp)
  const summaryOpen = useDailySummaryStore((s) => s.open)
  const visible = levelUp !== null && !summaryOpen
  const to = levelUp?.to

  useEffect(() => {
    if (!visible) return
    playLevelUpChime()
    const timeout = window.setTimeout(clearLevelUp, DISPLAY_MS)
    return () => window.clearTimeout(timeout)
  }, [visible, to, clearLevelUp])

  if (!levelUp || summaryOpen) return null

  const newTitle = getAvatarStage(levelUp.to).title
  const titleChanged = newTitle !== getAvatarStage(levelUp.from).title

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center px-4">
      <div role="status" className="cv-panel cv-panel--gold cv-float-in pointer-events-auto relative w-full max-w-xs overflow-hidden px-5 py-4 text-center">
        <div aria-hidden="true" className="cv-levelup-burst cv-levelup-rays" />
        <p className="cv-label relative text-gold-300">Ascensión</p>
        <p className="cv-title cv-levelup-text relative mt-1 text-4xl">
          Nivel {levelUp.from} → {levelUp.to}
        </p>
        <ul className="relative mt-2 flex flex-col gap-0.5 font-body text-silver-100">
          <li>+{levelUp.maxHpGain} de vida máxima (ahora {levelUp.maxHp})</li>
          <li>Vida restaurada al máximo</li>
          {titleChanged && <li className="text-gold-300">Nuevo rango: {newTitle}</li>}
        </ul>
        <button type="button" onClick={clearLevelUp} className="cv-btn cv-btn--gold relative mt-3 px-3 py-1">
          Continuar
        </button>
      </div>
    </div>
  )
}

export default LevelUpCelebration