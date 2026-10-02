import { ACHIEVEMENTS } from '../lib/achievements'
import { ORB, OUTLINE } from '../lib/pixelArt'
import { useAchievementsStore } from '../store/useAchievementsStore'
import PixelArt from './PixelArt'

const LOCKED_PALETTE = { O: OUTLINE, m: '#2a2e44', L: '#4b5170', d: '#15172a' }

function RelicsGrid() {
  const unlocked = useAchievementsStore((s) => s.unlocked)

  return (
    <div className="grid grid-cols-3 gap-2">
      {ACHIEVEMENTS.map((def) => {
        const isUnlocked = Boolean(unlocked[def.id])
        const palette = isUnlocked
          ? { O: OUTLINE, m: def.color, L: '#ffffff', d: def.dark }
          : LOCKED_PALETTE
        return (
          <div
            key={def.id}
            title={isUnlocked ? def.description : `Bloqueada: ${def.description}`}
            className={`flex flex-col items-center gap-1 border-2 px-1 py-2 text-center ${
              isUnlocked
                ? 'border-gold-500/70 bg-night-700/60'
                : 'border-silver-700/40 bg-night-950/60'
            }`}
          >
            <PixelArt
              rows={ORB}
              palette={palette}
              scale={4}
              className={isUnlocked ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]' : ''}
            />
            <p
              className={`font-pixel text-base leading-none ${isUnlocked ? 'text-gold-300' : 'text-silver-700'}`}
            >
              {isUnlocked ? def.name : '? ? ? ? ?'}
            </p>
            <p className="font-body text-[11px] leading-tight text-silver-500 italic">
              {def.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default RelicsGrid
