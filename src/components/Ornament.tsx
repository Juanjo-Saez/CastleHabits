import { GOLD_GEM_PALETTE, ORNAMENT } from '../lib/pixelArt'
import PixelArt from './PixelArt'

function Ornament({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-hidden>
      <div className="h-[3px] flex-1 border-b border-black bg-gradient-to-r from-transparent via-gold-600 to-gold-400" />
      <PixelArt rows={ORNAMENT} palette={GOLD_GEM_PALETTE} scale={2} />
      <div className="h-[3px] flex-1 border-b border-black bg-gradient-to-l from-transparent via-gold-600 to-gold-400" />
    </div>
  )
}

export default Ornament
