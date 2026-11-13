import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import type { ReactNode } from 'react'
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
import { soulChanceWithPity, soulDefinition } from '../lib/souls'
import { useBossStore } from '../store/useBossStore'
import { usePlayerStore } from '../store/usePlayerStore'
import BossSprite from '../components/BossSprite'
import PageHeader from '../components/PageHeader'

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

function FolioSection({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="border-t border-gold-600/50 pt-3">
      <h3 className="cv-label mb-2 text-gold-400">{title}</h3>
      {children}
    </section>
  )
}

function UnknownFolio({ boss, entry }: Readonly<{ boss: BossDefinition; entry: BestiaryEntry }>) {
  return (
    <div className="cv-bestiary-turn flex flex-col items-center gap-4 py-6 text-center">
      <div className="cv-bestiary-illustration flex h-48 w-full items-center justify-center">
        <div aria-hidden="true" className="opacity-70" style={{ filter: 'brightness(0)' }}>
          <BossSprite bossId={boss.id} scale={3} />
        </div>
      </div>
      <div>
        <p className="font-pixel text-2xl tracking-widest text-gold-300">??????</p>
        <p className="mt-1 font-body text-silver-300">Esta criatura aún no se ha revelado.</p>
        <p className="mt-3 font-pixel text-lg text-silver-500">
          Victorias: {entry.victories} · Derrotas: {entry.defeats}
        </p>
        <p className="mt-1 font-body text-sm italic text-silver-500">
          Consigue una victoria para descubrir su página.
        </p>
      </div>
    </div>
  )
}

function DiscoveredFolio({
  boss,
  entry,
  level,
  soulPity,
}: Readonly<{ boss: BossDefinition; entry: BestiaryEntry; level: number; soulPity: number }>) {
  const unlocks = bestiaryUnlocks(entry.victories)
  const multiplier = rewardMultiplier(level)
  const tally = `Victorias: ${entry.victories} · Derrotas: ${entry.defeats}`

  return (
    <article className="cv-bestiary-turn flex flex-col gap-4">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="cv-bestiary-illustration flex min-h-48 w-full items-center justify-center py-4">
          <BossSprite bossId={boss.id} scale={3} />
        </div>
        <div>
          <h2 className="cv-shadow font-pixel text-3xl leading-tight text-gold-300">{boss.name}</h2>
          <p className="mt-2 font-body text-silver-200">{boss.description}</p>
          <p className="mt-2 font-pixel text-lg text-silver-400">
            {tally}
            {entry.firstVictoryOn
              ? ` · Primera victoria: ${format(parseISO(entry.firstVictoryOn), 'dd/MM/yyyy')}`
              : ''}
          </p>
        </div>
      </header>

      <FolioSection title="Encuentro">
        <p className="font-body text-silver-100">{bestiaryMechanic(boss)}</p>
        {boss.effects.map((effect) => (
          <p key={effect.kind} className="mt-1 font-body text-sm text-silver-300">
            {describeEffectLong(effect)}
          </p>
        ))}
        <p className="mt-2 font-body text-sm text-silver-500">
          Derrota: {boss.defeatText ?? `${boss.defeatDamage} de daño directo${boss.defeatCurse ? ` y la maldición ${CURSES[boss.defeatCurse.id].name}` : ''}.`}
        </p>
      </FolioSection>

      <FolioSection title={`Recompensa · nivel ${level}`}>
        <p className="font-body text-silver-100">
          {Math.round(boss.reward.xp * multiplier)} EXP · {Math.round(boss.reward.coins * multiplier)} monedas
        </p>
        {boss.firstVictoryCosmetic && (
          <p className="mt-1 font-body text-sm text-silver-300">
            Primera victoria: insignia permanente Corona de la noche (no equipable).
          </p>
        )}
      </FolioSection>

      <FolioSection title="Botín">
        {unlocks.odds ? (
          <>
            {boss.drops.length > 0 ? (
              <ul className="flex flex-col gap-1 font-body text-silver-100">
                {boss.drops.map((drop) => (
                  <li key={drop.item} className="flex justify-between gap-3">
                    <span>{dropLabel(drop)}</span>
                    <span className="shrink-0">{percent(drop.chance)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-body text-sm text-silver-300">No concede consumibles regulares.</p>
            )}
            {boss.specialDrop && (
              <p className="mt-2 font-body text-sm text-silver-100">
                {boss.specialDrop.name}: {percent(boss.specialDrop.chance)}. {boss.specialDrop.description}
              </p>
            )}
            <p className="mt-2 font-body text-xs italic text-silver-500">
              Cada objeto se sortea por separado; si no sale ninguno, se concede el más probable.
            </p>
          </>
        ) : (
          <LockedNote title="Probabilidades" unlock={BESTIARY_UNLOCKS.odds} victories={entry.victories} />
        )}
      </FolioSection>

      <FolioSection title="Crónica">
        {unlocks.lore ? (
          <p className="font-body italic text-silver-200">{boss.lore}</p>
        ) : (
          <LockedNote title="Historia completa" unlock={BESTIARY_UNLOCKS.lore} victories={entry.victories} />
        )}
      </FolioSection>

      <FolioSection title="Alma">
        {boss.id === 'sukamon' ? (
          <p className="font-body text-silver-100">Este minijefe no concede alma.</p>
        ) : unlocks.soul ? (
          <p className="font-body text-sm text-silver-100">
            Probabilidad por victoria: {percent(soulChanceWithPity(boss.soulChance, soulPity))}
            {' '}(base {percent(boss.soulChance)}, piedad {soulPity} %). {soulDefinition(boss.id).effectDescription}
          </p>
        ) : (
          <LockedNote title="Probabilidad del alma" unlock={BESTIARY_UNLOCKS.soul} victories={entry.victories} />
        )}
      </FolioSection>

      <FolioSection title="Versión élite">
        {unlocks.elite ? (
          <p className="font-body text-silver-100">Desbloqueada. Sus encuentros llegarán más adelante.</p>
        ) : (
          <LockedNote title="Versión élite" unlock={BESTIARY_UNLOCKS.elite} victories={entry.victories} />
        )}
      </FolioSection>
    </article>
  )
}

function BookNavigation({
  pageIndex,
  pageCount,
  label,
  onPrevious,
  onNext,
}: Readonly<{
  pageIndex: number
  pageCount: number
  label: string
  onPrevious: () => void
  onNext: () => void
}>) {
  return (
    <nav aria-label={label} className="flex items-center justify-between gap-2 py-2">
      <button
        type="button"
        aria-label="Página anterior"
        onClick={onPrevious}
        disabled={pageIndex === 0}
        className="cv-btn cv-btn--ghost h-11 w-11 p-0 text-xl disabled:opacity-40"
      >
        <span aria-hidden="true">◀</span>
      </button>
      <div className="text-center" aria-live="polite" aria-atomic="true">
        <p className="whitespace-nowrap font-pixel text-lg text-gold-300">Folio {pageIndex + 1}/{pageCount}</p>
      </div>
      <button
        type="button"
        aria-label="Página siguiente"
        onClick={onNext}
        disabled={pageIndex >= pageCount - 1}
        className="cv-btn cv-btn--ghost h-11 w-11 p-0 text-xl disabled:opacity-40"
      >
        <span aria-hidden="true">▶</span>
      </button>
    </nav>
  )
}

function BestiaryPage() {
  const profile = usePlayerStore((s) => s.profile)
  const encounters = useBossStore((s) => s.encounters)
  const [pageIndex, setPageIndex] = useState(0)

  if (!profile) return null

  const entries = bestiaryOf(encounters)
  const pageCount = BOSS_IDS.length
  const bossId = BOSS_IDS[pageIndex]
  if (!bossId) return null

  const currentEntry = entries[bossId]
  const discoveredCount = BOSS_IDS.filter((id) => entries[id].victories > 0).length

  return (
    <>
      <PageHeader title="Bestiario" subtitle="Un códice de criaturas del castillo." />
      <section aria-label="Libro del bestiario" className="relative z-10 px-3 pb-6">
        <div className="cv-bestiary-book p-2">
          <div className="cv-bestiary-page p-4 pl-6">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-gold-600/50 pb-2">
              <p className="cv-label text-gold-400">Códice · {discoveredCount}/{pageCount}</p>
              <p className="font-pixel text-sm text-silver-500">NOCTURNO</p>
            </div>
            <BookNavigation
              pageIndex={pageIndex}
              pageCount={pageCount}
              label="Navegación al inicio del folio"
              onPrevious={() => setPageIndex((index) => Math.max(0, index - 1))}
              onNext={() => setPageIndex((index) => Math.min(pageCount - 1, index + 1))}
            />
            {currentEntry.victories > 0 ? (
              <DiscoveredFolio
                key={bossId}
                boss={BOSSES[bossId]}
                entry={currentEntry}
                level={profile.level}
                soulPity={profile.soulPity?.[bossId] ?? 0}
              />
            ) : (
              <UnknownFolio key={bossId} boss={BOSSES[bossId]} entry={currentEntry} />
            )}
            <BookNavigation
              pageIndex={pageIndex}
              pageCount={pageCount}
              label="Navegación al final del folio"
              onPrevious={() => setPageIndex((index) => Math.max(0, index - 1))}
              onNext={() => setPageIndex((index) => Math.min(pageCount - 1, index + 1))}
            />
            <p className="mt-2 text-center font-pixel text-xs tracking-widest text-gold-600">
              ✦ FIN DEL FOLIO ✦
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

export default BestiaryPage
