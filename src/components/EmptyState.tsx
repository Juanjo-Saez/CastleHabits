import type { ReactNode } from 'react'

function EmptyState({ icon, children }: Readonly<{ icon: ReactNode; children: ReactNode }>) {
  return (
    <div className="cv-panel flex flex-col items-center gap-3 px-6 py-8 text-center">
      {icon}
      <p className="font-body text-silver-300 italic">{children}</p>
    </div>
  )
}

export default EmptyState
