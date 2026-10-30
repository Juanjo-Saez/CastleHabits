import { format, parseISO } from 'date-fns'
import {
  BESTIARY_UNLOCKS,
  BOSSES,
  BOSS_IDS,
  RESOURCE_LABEL,
  bestiaryMechanic,
  bestiaryOf,
  bestiaryUnlocks,
  describeEffectLong,
  rewardMultiplier,
  type BestiaryEntry,
  type BossDefinition,
  type DropEntry,
} from '../lib/bosses'
import { CURSES } from '../lib/curses'
import { useBossStore } from '../store/useBossStore'
import { usePlayerStore } from '../store/usePlayerStore'
import BossSprite from './BossSprite'
import SectionTitle from './SectionTitle'

function percent(chance: number): string {
  return `${(chance * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`
}

function dropLabel(drop: DropEntry): string {
  if (drop.item === 'goldBag') return `Bolsa de oro (${drop.min}–${drop.max} monedas)`
  const range = drop.min === drop.max ? '' : ` (${drop.min}–${drop.max})`
  return `${RESOURCE_LABEL[drop.item]}${range}`
}

function LockedNote({ title, unlock, victories }: Readonly<{ title: string; unlock: number; victories: number }>) {
  const missing = unlock - victories
  return (
    <p className="font-body text-sm italic text-silver-500">
      {title}: se revela con {unlock} {unlock === 1 ? 'victoria' : 'victorias'} (faltan {missing}).
    </p>
  )
}

function BestiaryCard({ boss, entry, level }: Readonly<{ boss: BossDefinition; entry: BestiaryEntry; level: number }>) {
  const unlocks = bestiaryUnlocks(entry.victories)
  const multiplier = rewardMultiplier(level)
  const tally = `Victorias: ${entry.victories} · Derrotas: ${entry.defeats}`

  if (!unlocks.page) {
    return (
      <li className="cv-plate flex items-center gap-3 p-2">
        <span role="img" aria-label="Criatura desconocida" className="shrink-0 opacity-80" style={{ filter: 'brightness(0)' }}>
          <BossSprite bossId={boss.id} scale={2} />
        </span>
        <div className="min-w-0">
          <p className="cv-shadow font-pixel text-xl leading-none text-silver-500">???</p>
          <p className="mt-1 font-body text-sm text-silver-500">{tally}</p>
          <p className="font-body text-sm italic text-silver-500">Véncela una vez para revelar su página.</p>
        </div>
      </li>
    )
  }

  return (
    <li className="cv-plate flex flex-col gap-3 p-2">
      <div className="flex items-center gap-3">
        <BossSprite bossId={boss.id} scale={2} />
        <div className="min-w-0">
          <p className="cv-shadow font-pixel text-xl leading-none text-gold-300">{boss.name}</p>
          <p className="mt-1 font-body text-sm text-silver-300">{boss.description}</p>
        </div>
      </div>

      <div>
        <p className="cv-label">Cómo vencerla</p>
        <p className="font-body text-sm text-silver-100">{bestiaryMechanic(boss)}</p>
        {boss.effects.map((effect) => (
          <p key={`${effect.kind}-${effect.percent}`} className="font-body text-sm text-silver-300">
            {describeEffectLong(effect)}
          </p>
        ))}
        <p className="font-body text-sm text-silver-500">
          Derrota: {boss.defeatDamage} de daño directo
          {boss.defeatCurse ? ` y la maldición ${CURSES[boss.defeatCurse.id].name}` : ''}.
        </p>
      </div>

      <div>
        <p className="cv-label">Recompensa al nivel {level}</p>
        <p className="font-body text-sm text-silver-100">
          EXP {Math.round(boss.reward.xp * multiplier)} · Oro {Math.round(boss.reward.coins * multiplier)}
        </p>
      </div>

      <div>
        <p className="cv-label">Tu marca</p>
        <p className="font-body text-sm text-silver-300">
          {tally}
          {entry.firstVictoryOn ? ` · Primera victoria: ${format(parseISO(entry.firstVictoryOn), 'dd/MM/yyyy')}` : ''}
        </p>
      </div>

      <div>
        <p className="cv-label">Probabilidades de objetos</p>
        {unlocks.odds ? (
          <>
            <ul className="font-body text-sm text-silver-100">
              {boss.drops.map((drop) => (
                <li key={drop.item}>{dropLabel(drop)}: {percent(drop.chance)}</li>
              ))}
            </ul>
            <p className="font-body text-xs italic text-silver-500">
              Cada objeto se sortea por separado; si no sale ninguno, se concede el más probable.
            </p>
          </>
        ) : (
          <LockedNote title="Probabilidades" unlock={BESTIARY_UNLOCKS.odds} victories={entry.victories} />
        )}
      </div>

      <div>
        <p className="cv-label">Historia y versión élite</p>
        {unlocks.lore ? (
          <p className="font-body text-sm text-silver-300 italic">{boss.lore}</p>
        ) : (
          <LockedNote title="Historia completa" unlock={BESTIARY_UNLOCKS.lore} victories={entry.victories} />
        )}
        {unlocks.elite ? (
          <p className="font-body text-sm text-silver-100">Versión élite: desbloqueada. Sus encuentros llegarán más adelante.</p>
        ) : (
          <LockedNote title="Versión élite" unlock={BESTIARY_UNLOCKS.elite} victories={entry.victories} />
        )}
      </div>

      <div>
        <p className="cv-label">Alma</p>
        {unlocks.soul ? (
          <p className="font-body text-sm text-silver-100">Probabilidad base del alma: {percent(boss.soulChance)} por victoria.</p>
        ) : (
          <LockedNote title="Probabilidad del alma" unlock={BESTIARY_UNLOCKS.soul} victories={entry.victories} />
        )}
      </div>
    </li>
  )
}

/** Bestiario del Perfil: cada boss se revela por victorias y las derrotas siempre se cuentan. */
function BestiaryPanel() {
  const profile = usePlayerStore((s) => s.profile)
  const encounters = useBossStore((s) => s.encounters)
  if (!profile) return null

  const entries = bestiaryOf(encounters)
  return (
    <div className="cv-panel flex flex-col gap-3 p-3">
      <SectionTitle>Bestiario</SectionTitle>
      <p className="font-body text-sm text-silver-500 italic">
        Cada criatura se revela al vencerla. Las derrotas siempre quedan anotadas.
      </p>
      <ul className="flex flex-col gap-3">
        {BOSS_IDS.map((id) => (
          <BestiaryCard key={id} boss={BOSSES[id]} entry={entries[id]} level={profile.level} />
        ))}
      </ul>
    </div>
  )
}

export default BestiaryPanel
