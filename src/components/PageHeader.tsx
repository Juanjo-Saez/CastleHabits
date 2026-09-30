function PageHeader({
  title,
  subtitle,
}: Readonly<{
  title: string
  subtitle?: string
}>) {
  return (
    <header className="sticky top-0 z-10 bg-crypt-950/95 px-5 pt-6 pb-4 backdrop-blur">
      <h1 className="font-display text-2xl tracking-wide text-gold-400 [text-shadow:0_0_12px_rgba(201,162,75,0.35)]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 font-body text-sm italic text-parchment-500">
          {subtitle}
        </p>
      )}
      <div className="ornate-divider mt-4" />
    </header>
  )
}

export default PageHeader
