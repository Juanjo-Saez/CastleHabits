import { soulDefinition, soulSlotsForLevel } from '../lib/souls'
import { usePlayerStore } from '../store/usePlayerStore'
import type { SoulId } from '../types'
import SectionTitle from './SectionTitle'

function SoulsPanel() {
  const profile = usePlayerStore((state) => state.profile)
  const equipSoul = usePlayerStore((state) => state.equipSoul)
  if (!profile) return null

  const souls = Object.entries(profile.souls ?? {}) as [SoulId, { rank: number; fragments: number }][]
  const slots = soulSlotsForLevel(profile.level)

  return (
    <div className="cv-panel p-3">
      <SectionTitle>Almas</SectionTitle>
      <p className="mt-1 font-body text-sm text-silver-500 italic">
        Equipa {slots} {slots === 1 ? 'alma' : 'almas'} en esta expedición. Las almas y sus rangos sobreviven al renacer.
      </p>
      {souls.length === 0 ? (
        <p className="mt-3 font-body text-sm text-silver-400">Todavía no has conseguido almas.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {souls.map(([id, progress]) => {
            const definition = soulDefinition(id)
            const equipped = profile.equippedSouls?.includes(id)
            return (
              <div key={id} className="cv-plate flex items-center gap-2 p-2">
                <div className="min-w-0 flex-1">
                  <p className="font-pixel text-base text-gold-300">{definition.name}</p>
                  <p className="font-body text-xs text-silver-300">
                    Rango {progress.rank} · {progress.fragments}/3 fragmentos · {definition.effectDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void equipSoul(id)}
                  aria-pressed={equipped}
                  className={equipped ? 'cv-btn cv-btn--gold px-2 py-1 text-xs' : 'cv-btn cv-btn--ghost px-2 py-1 text-xs'}
                >
                  {equipped ? 'Desequipar' : 'Equipar'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SoulsPanel
