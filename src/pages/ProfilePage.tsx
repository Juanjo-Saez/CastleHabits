import BackupSettings from '../components/BackupSettings'
import HunterPortrait from '../components/HunterPortrait'
import NotificationSettings from '../components/NotificationSettings'
import PageHeader from '../components/PageHeader'
import RewardsShop from '../components/RewardsShop'
import RoutesPanel from '../components/RoutesPanel'
import SectionTitle from '../components/SectionTitle'
import { getAvatarStage, xpToNextLevel } from '../lib/gamification'
import { effectiveMaxHp } from '../lib/routes'
import { usePlayerStore } from '../store/usePlayerStore'

function ProfilePage() {
  const profile = usePlayerStore((s) => s.profile)

  if (!profile) {
    return <p className="p-8 text-center font-pixel text-xl text-silver-500">Cargando cazador...</p>
  }

  const stage = getAvatarStage(profile.level)
  const nextLevelXp = xpToNextLevel(profile.level)
  const xpPercent = Math.min(100, (profile.xp / nextLevelXp) * 100)
  const maxHp = effectiveMaxHp(profile)
  const hpPercent = Math.min(100, (profile.hp / maxHp) * 100)

  return (
    <>
      <PageHeader title="El Cazador" subtitle="Tu progreso queda escrito en la piedra." />
      <section className="relative z-10 flex flex-col gap-4 px-3">
        <div className="cv-panel cv-panel--gold flex items-center gap-3 p-3">
          <HunterPortrait level={profile.level} scale={4} />
          <div className="min-w-0 flex-1">
            <p className="cv-label">Nivel {profile.level}</p>
            <h2 className="cv-shadow mt-1 font-pixel text-2xl leading-none text-gold-300">{stage.title}</h2>
            <div className="mt-3">
              <div className="mb-1 flex justify-between font-pixel text-sm text-silver-500">
                <span>EXP</span><span>{profile.xp}/{nextLevelXp}</span>
              </div>
              <div className="cv-bar"><span className="cv-fill-mp" style={{ width: `${xpPercent}%` }} /></div>
            </div>
            <div className="mt-2">
              <div className="mb-1 flex justify-between font-pixel text-sm text-silver-500">
                <span>VITALIDAD</span><span>{profile.hp}/{maxHp}</span>
              </div>
              <div className="cv-bar"><span className="cv-fill-hp" style={{ width: `${hpPercent}%` }} /></div>
            </div>
          </div>
        </div>

        <RoutesPanel />

        <RewardsShop />

        <div className="cv-panel cv-panel--blood p-3">
          <SectionTitle>Modo de juego</SectionTitle>
          <div className="mt-2 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="cv-shadow font-pixel text-xl leading-none text-silver-100">
                Hardcore [ACTIVO]
              </p>
              <p className="mt-1 font-body text-sm text-silver-500 italic">
                Es una regla permanente: si la vitalidad llega a cero, la expedición termina y tendrás que renacer desde el nivel 1.
              </p>
            </div>
          </div>
        </div>

        <div className="cv-panel flex flex-col gap-3 p-3">
          <SectionTitle>Configuración</SectionTitle>
          <NotificationSettings />
          <div className="ornate-divider" />
          <BackupSettings />
        </div>
      </section>
    </>
  )
}

export default ProfilePage