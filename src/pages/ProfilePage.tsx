import AchievementsList from '../components/AchievementsList'
import PageHeader from '../components/PageHeader'
import RewardsShop from '../components/RewardsShop'
import { getAvatarStage, xpToNextLevel } from '../lib/gamification'
import { usePlayerStore } from '../store/usePlayerStore'

function ProfilePage() {
  const profile = usePlayerStore((s) => s.profile)

  if (!profile) return null

  const xpNeeded = xpToNextLevel(profile.level)
  const xpPct = Math.min(100, (profile.xp / xpNeeded) * 100)
  const hpPct = Math.min(100, (profile.hp / profile.maxHp) * 100)
  const avatar = getAvatarStage(profile.level)

  return (
    <div>
      <PageHeader title="El Cazador" subtitle="Nivel, vitalidad y reliquias" />

      <div className="flex flex-col gap-5 px-5 py-4">
        <div className="flex items-center gap-4 rounded-sm border border-gold-600/30 bg-crypt-900/60 p-4">
          <span className="text-4xl">{avatar.icon}</span>
          <div className="flex-1">
            <p className="font-display text-lg text-gold-400">
              Nivel {profile.level}
            </p>
            <p className="text-xs italic text-parchment-500">
              {avatar.title} · {profile.coins} monedas
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-parchment-500">
            <span>Experiencia</span>
            <span>
              {profile.xp} / {xpNeeded}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-crypt-700">
            <div
              className="h-full bg-gradient-to-r from-arcane-500 to-gold-400"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-parchment-500">
            <span>Vitalidad</span>
            <span>
              {profile.hp} / {profile.maxHp}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-crypt-700">
            <div
              className="h-full bg-gradient-to-r from-blood-700 to-blood-400"
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <h2 className="mb-2 font-heading text-xs tracking-widest text-parchment-500 uppercase">
          Logros
        </h2>
        <AchievementsList />
      </div>

      <div className="px-5 pb-8">
        <RewardsShop />
      </div>
    </div>
  )
}

export default ProfilePage
