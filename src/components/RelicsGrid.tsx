import { RELICS } from '../lib/relics'
import { ANCIENT_AMULET, ANCIENT_AMULET_PALETTE, ORB, OUTLINE } from '../lib/pixelArt'
import { usePlayerStore } from '../store/usePlayerStore'
import PixelArt from './PixelArt'

const LOCKED_PALETTE = { O: OUTLINE, m: '#2a2e44', L: '#4b5170', d: '#15172a' }
const LOCKED_AMULET_PALETTE = { O: OUTLINE, G: '#2a2e44', L: '#4b5170', R: '#15172a' }

function RelicsGrid() {
  const owned = usePlayerStore((s) => s.profile?.relics ?? [])

  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.values(RELICS).map((def) => {
        const isUnlocked = owned.includes(def.id)
        const palette = isUnlocked
          ? { O: OUTLINE, m: '#b88a3b', L: '#ffffff', d: '#5e4712' }
          : LOCKED_PALETTE
        return (
          <div
            key={def.id}
            title={isUnlocked ? def.description : 'Reliquia no obtenida en esta expedición'}
            className={`flex flex-col items-center gap-1 border-2 px-1 py-2 text-center ${
              isUnlocked
                ? 'border-gold-500/70 bg-night-700/60'
                : 'border-silver-700/40 bg-night-950/60'
            }`}
          >
            <PixelArt
              rows={def.id === 'ancientAmulet' ? ANCIENT_AMULET : ORB}
              palette={
                def.id === 'ancientAmulet'
                  ? isUnlocked ? ANCIENT_AMULET_PALETTE : LOCKED_AMULET_PALETTE
                  : palette
              }
              scale={4}
              className={isUnlocked ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]' : ''}
            />
            <p
              className={`font-pixel text-base leading-none ${isUnlocked ? 'text-gold-300' : 'text-silver-700'}`}
            >
              {isUnlocked ? def.name : '???'}
            </p>
            <p className="font-body text-[11px] leading-tight text-silver-500 italic">
              {isUnlocked ? def.description : 'Se pierde al renacer.'}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default RelicsGrid
