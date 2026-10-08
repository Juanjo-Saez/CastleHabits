import { COIN, COIN_PALETTE, HEART, HEART_PALETTE } from '../lib/pixelArt'
import { effectiveMaxHp } from '../lib/routes'
import { usePlayerStore } from '../store/usePlayerStore'
import PixelArt from './PixelArt'

function Hud() {
  const profile = usePlayerStore((s) => s.profile)
  if (!profile) return null

  const maxHp = effectiveMaxHp(profile)
  const hpPct = Math.min(100, (profile.hp / maxHp) * 100)

  return (
    <div className="cv-shadow flex items-center gap-3 font-pixel text-lg leading-none">
      <div className="flex items-baseline gap-1">
        <span className="text-silver-500">LV</span>
        <span className="text-2xl text-gold-300">{profile.level}</span>
      </div>

      <div className="flex flex-1 items-center gap-1.5">
        <PixelArt rows={HEART} palette={HEART_PALETTE} scale={2} />
        <div className="cv-bar flex-1">
          <span className="cv-fill-hp" style={{ width: `${hpPct}%` }} />
        </div>
        <span className="text-silver-100">
          {profile.hp}
          <span className="text-silver-500">/{maxHp}</span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        <PixelArt rows={COIN} palette={COIN_PALETTE} scale={2} />
        <span className="text-gold-300">{profile.coins}</span>
      </div>
    </div>
  )
}

export default Hud
