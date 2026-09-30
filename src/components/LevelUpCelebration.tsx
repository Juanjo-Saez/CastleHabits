import { useEffect } from 'react'
import { playLevelUpChime } from '../lib/sound'
import { usePlayerStore } from '../store/usePlayerStore'

function LevelUpCelebration() {
  const level = usePlayerStore((s) => s.justLeveledUp)
  const clearLevelUp = usePlayerStore((s) => s.clearLevelUp)

  useEffect(() => {
    if (level === null) return
    playLevelUpChime()
    const timeout = setTimeout(() => clearLevelUp(), 2600)
    return () => clearTimeout(timeout)
  }, [level, clearLevelUp])

  if (level === null) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className="animate-pulse rounded-sm border-2 border-gold-400 bg-crypt-950/95 px-8 py-6 text-center shadow-[0_0_40px_rgba(201,162,75,0.5)]">
        <p className="font-display text-3xl text-gold-400">¡Subes de Nivel!</p>
        <p className="mt-1 font-heading text-lg text-parchment-100">
          Nivel {level}
        </p>
      </div>
    </div>
  )
}

export default LevelUpCelebration
