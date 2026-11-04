import { getAvatarStage } from '../lib/gamification'
import { HUNTER } from '../lib/pixelArt'
import PixelArt from './PixelArt'

function HunterPortrait({
  level,
  scale = 5,
  sukamon,
}: Readonly<{ level: number; scale?: number; sukamon?: boolean }>) {
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
      {sukamon ? (
        <img
          src="/images/sukamon-portrait.png"
          alt="Retrato del cazador cubierto de lodo"
          className="h-16 w-20 object-contain"
        />
      ) : (
        <PixelArt rows={HUNTER} palette={stage.palette} scale={scale} title={stage.title} />
      )}
    </div>
  )
}

export default HunterPortrait
