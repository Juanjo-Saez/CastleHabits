import type { ReactNode } from 'react'
import { DIAMOND, GOLD_GEM_PALETTE } from '../lib/pixelArt'
import PixelArt from './PixelArt'

function SectionTitle({
  children,
  action,
}: Readonly<{ children: ReactNode; action?: ReactNode }>) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <PixelArt rows={DIAMOND} palette={GOLD_GEM_PALETTE} scale={2} />
      <h2 className="cv-shadow font-pixel text-xl leading-none tracking-[0.15em] text-gold-400 uppercase">
        {children}
      </h2>
      <div className="h-[2px] flex-1 bg-gradient-to-r from-gold-500/70 to-transparent" />
      {action}
    </div>
  )
}

export default SectionTitle
