import PageHeader from '../components/PageHeader'

function ProfilePage() {
  return (
    <div>
      <PageHeader title="Perfil" subtitle="Nivel, XP y recompensas" />
      <div className="flex flex-col items-center gap-2 px-4 py-16 text-center text-slate-500 dark:text-slate-400">
        <span className="text-3xl">🧑</span>
        <p>
          Fase 4: nivel, XP, HP, monedas, logros y tienda de recompensas.
        </p>
      </div>
    </div>
  )
}

export default ProfilePage
