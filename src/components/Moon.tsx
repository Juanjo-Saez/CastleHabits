import moonArt from '../assets/moon.png'
import type { MoonAppearance } from '../lib/moon'

function Moon({
  appearance = 'normal',
  className = '',
}: Readonly<{ appearance?: MoonAppearance; className?: string }>) {
  return (
    <img
      src={moonArt}
      width={320}
      height={320}
      alt=""
      draggable={false}
      decoding="async"
      className={`cv-moon cv-moon--${appearance} ${className}`}
      aria-hidden="true"
    />
  )
}

export default Moon
