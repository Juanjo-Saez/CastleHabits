import PageHeader from '../components/PageHeader'

function ProfilePage() {
  return (
    <div>
      <PageHeader title="El Cazador" subtitle="Nivel, vitalidad y reliquias" />
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-parchment-500">
        <span className="text-3xl">🧛</span>
        <p className="font-body italic">
          Fase 4: nivel, XP, HP, monedas, logros y tienda de recompensas.
        </p>
      </div>
    </div>
  )
}

export default ProfilePage
