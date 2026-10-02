import { useEffect } from 'react'
import { playLevelUpChime } from '../lib/sound'
import { usePlayerStore } from '../store/usePlayerStore'

function LevelUpCelebration() {
  const level = usePlayerStore((s) => s.justLeveledUp)
  const clearLevelUp = usePlayerStore((s) => s.clearLevelUp)

  useEffect(() => {
    if (level === null) return
    playLevelUpChime()
    const timeout = window.setTimeout(clearLevelUp, 2800)
    return () => window.clearTimeout(timeout)
  }, [level, clearLevelUp])

  if (level === null) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center px-4">
      <div className="cv-panel cv-panel--gold cv-float px-6 py-4 text-center">
        <p className="cv-label text-gold-300">Ascensión</p>
        <p className="cv-title mt-1 text-4xl">Nivel {level}</p>
        <p className="mt-1 font-body text-silver-300 italic">El poder de la noche crece.</p>
      </div>
    </div>
  )
}

export default LevelUpCelebration