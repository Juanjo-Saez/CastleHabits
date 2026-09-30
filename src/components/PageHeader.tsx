function PageHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <header className="sticky top-0 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </header>
  )
}

export default PageHeader
