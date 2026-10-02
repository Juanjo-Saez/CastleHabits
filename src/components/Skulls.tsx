import { DIFFICULTY_LABEL, DIFFICULTY_SKULLS } from '../lib/gamification'
import { SKULL, SKULL_DIM_PALETTE, SKULL_PALETTE } from '../lib/pixelArt'
import type { Difficulty } from '../types'
import PixelArt from './PixelArt'

function Skulls({ difficulty, scale = 2 }: Readonly<{ difficulty: Difficulty; scale?: number }>) {
  const count = DIFFICULTY_SKULLS[difficulty]
  return (
    <span className="inline-flex gap-0.5" title={DIFFICULTY_LABEL[difficulty]}>
      {[1, 2, 3, 4].map((n) => (
        <PixelArt
          key={n}
          rows={SKULL}
          palette={n <= count ? SKULL_PALETTE : SKULL_DIM_PALETTE}
          scale={scale}
        />
      ))}
      <span className="sr-only">{DIFFICULTY_LABEL[difficulty]}</span>
    </span>
  )
}

export default Skulls
