import { useState } from 'react'
import BackupSettings from '../components/BackupSettings'
import BestiaryPanel from '../components/BestiaryPanel'
import CursesPanel from '../components/CursesPanel'
import HunterPortrait from '../components/HunterPortrait'
import NotificationSettings from '../components/NotificationSettings'
import PageHeader from '../components/PageHeader'
import RewardsShop from '../components/RewardsShop'
import RoutesPanel from '../components/RoutesPanel'
import SectionTitle from '../components/SectionTitle'
import { getAvatarStage, xpToNextLevel } from '../lib/gamification'
import { clearReminderDate } from '../lib/notifications'
import { clearSummaryMarker } from '../lib/summaryMarker'
import { effectiveMaxHp } from '../lib/routes'
import { restartExpedition } from '../store/routeActions'
import { resetAllAppData } from '../db/database'
import { useAchievementsStore } from '../store/useAchievementsStore'
import { useBossStore } from '../store/useBossStore'
import { useItemsStore } from '../store/useItemsStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { useRewardsStore } from '../store/useRewardsStore'

function ProfilePage() {
  const profile = usePlayerStore((s) => s.profile)
  const clearLevelUp = usePlayerStore((s) => s.clearLevelUp)
  const [confirmRetirement, setConfirmRetirement] = useState(false)
  const [confirmFullReset, setConfirmFullReset] = useState(false)
  const [resetError, setResetError] = useState(false)

  async function resetEverything() {
    try {
      await resetAllAppData()
      clearReminderDate()
      clearSummaryMarker()
      clearLevelUp()
      await Promise.all([
        useItemsStore.getState().load(),
        usePlayerStore.getState().load(),
        useAchievementsStore.getState().load(),
        useRewardsStore.getState().load(),
      ])
      await useBossStore.getState().sync()
      setConfirmFullReset(false)
      setResetError(false)
    } catch {
      setResetError(true)
    }
  }

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

        <CursesPanel />

        <BestiaryPanel />

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
          <div className="mt-3 border-t border-blood-700/40 pt-3">
            {confirmRetirement ? (
              <div role="alertdialog" aria-label="Confirmar jubilación" className="flex flex-col gap-3">
                <p className="font-body text-silver-100">
                  Empezarás otra expedición en nivel 1. Se reiniciarán nivel, monedas, recursos y progreso de rutas. Las misiones vinculadas a rutas se archivarán con su historial; tus demás tareas y recompensas se conservarán.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmRetirement(false)}
                    className="cv-btn cv-btn--ghost"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void restartExpedition()
                      setConfirmRetirement(false)
                    }}
                    className="cv-btn cv-btn--blood"
                  >
                    Jubilar y renacer
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRetirement(true)}
                className="cv-btn cv-btn--ghost text-blood-300"
              >
                Jubilar personaje
              </button>
            )}
          </div>
          <div className="mt-3 border-t border-blood-700/40 pt-3">
            {confirmFullReset ? (
              <div role="alertdialog" aria-label="Confirmar reinicio total" aria-modal="true" className="flex flex-col gap-3">
                <p className="font-body text-silver-100">
                  Se borrarán de este navegador todas las tareas, completados, eventos e historial, además del progreso del personaje, logros y recompensas personalizadas. Esta acción no se puede deshacer.
                </p>
                {resetError && (
                  <p role="alert" className="font-body text-blood-300">
                    No se pudieron borrar los datos. Inténtalo de nuevo.
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmFullReset(false)
                      setResetError(false)
                    }}
                    className="cv-btn cv-btn--ghost"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void resetEverything()}
                    className="cv-btn cv-btn--blood"
                  >
                    Borrar todo y empezar de cero
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmFullReset(true)}
                className="cv-btn cv-btn--ghost text-blood-300"
              >
                Reiniciar todos los datos
              </button>
            )}
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