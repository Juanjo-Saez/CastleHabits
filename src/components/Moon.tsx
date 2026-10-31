import type { MoonAppearance } from '../lib/moon'

function Moon({
  appearance = 'normal',
  className = '',
}: Readonly<{ appearance?: MoonAppearance; className?: string }>) {
  return (
    <svg
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      className={`cv-moon cv-moon--${appearance} ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="cv-moon__outline"
        d="M9 1h6v1h3v1h2v2h2v3h1v6h-1v3h-2v2h-3v1h-6v-1H8v-1H6v-2H4v-3H3v-5h1V6h2V4h2V3h3V2h-2z"
      />
      <path
        className="cv-moon__surface"
        d="M10 3h4v1h3v1h2v2h2v3h1v4h-1v3h-2v2h-3v1h-5v-1H8v-1H6v-2H5v-3H4v-4h1V8h2V6h2V5h2z"
      />
      <path
        className="cv-moon__shade"
        d="M15 4h2v1h3v2h2v3h1v4h-1v3h-2v2h-3v2h-2v-3h2v-2h1v-4h1v-4h-1V8h-2V6h-2z"
      />
      <path
        className="cv-moon__crater"
        d="M6 8h2v1h1v2H7v1H6z M14 6h2v1h1v2h-2v1h-1z M14 16h2v1h2v2h-3v-1h-1z"
      />
      <path
        className="cv-moon__highlight"
        d="M7 8h1v2H7z M14 7h1v1h1v1h-2z M15 17h1v1h1v1h-2z"
      />
      <path
        className="cv-moon__engraving"
        d="M7 18v-2h1v-2h1v-2h1v-2h2v2h1v2h1v2h1v2h-2v-2h-1v-2h-2v2h-1v2z M10 5h2v1h1v1h-1v1h-2V7H9V6h1z"
      />
    </svg>
  )
}

export default Moon
