import { getAvatarStage } from '../lib/gamification'
import { HUNTER } from '../lib/pixelArt'
import PixelArt from './PixelArt'

function HunterPortrait({ level, scale = 5 }: Readonly<{ level: number; scale?: number }>) {
  const stage = getAvatarStage(level)
  return (
    <div
      className="cv-panel flex shrink-0 items-center justify-center p-1"
      style={
        stage.aura
          ? { boxShadow: `0 0 18px ${stage.aura}, 0 6px 18px rgb(0 0 0 / 0.55)` }
          : undefined
      }
    >
      <PixelArt rows={HUNTER} palette={stage.palette} scale={scale} title={stage.title} />
    </div>
  )
}

export default HunterPortrait
