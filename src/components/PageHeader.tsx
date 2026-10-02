import Hud from './Hud'
import Ornament from './Ornament'

function PageHeader({
  title,
  subtitle,
}: Readonly<{
  title: string
  subtitle?: string
}>) {
  return (
    <header className="sticky top-0 z-20 bg-gradient-to-b from-night-950 via-night-950/90 to-transparent px-4 pt-3 pb-5">
      <Hud />
      <h1 className="cv-title mt-4 text-center text-5xl">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-center font-body text-sm text-silver-500 italic">
          {subtitle}
        </p>
      )}
      <Ornament className="mt-3" />
    </header>
  )
}

export default PageHeader
