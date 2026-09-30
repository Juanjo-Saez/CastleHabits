import { ACHIEVEMENTS } from '../lib/achievements'
import { useAchievementsStore } from '../store/useAchievementsStore'

function AchievementsList() {
  const unlocked = useAchievementsStore((s) => s.unlocked)

  return (
    <div className="flex flex-col gap-2">
      {ACHIEVEMENTS.map((def) => {
        const isUnlocked = Boolean(unlocked[def.id])
        return (
          <div
            key={def.id}
            className={`flex items-center gap-3 rounded-sm border px-4 py-3 ${
              isUnlocked
                ? 'border-gold-500/50 bg-crypt-800/70'
                : 'border-parchment-500/15 bg-crypt-900/40'
            }`}
          >
            <span className="text-xl">{isUnlocked ? '🏅' : '🔒'}</span>
            <div className="min-w-0 flex-1">
              <p
                className={`font-heading text-sm tracking-wide ${isUnlocked ? 'text-gold-400' : 'text-parchment-500'}`}
              >
                {def.name}
              </p>
              <p className="text-xs italic text-parchment-500">
                {def.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AchievementsList
