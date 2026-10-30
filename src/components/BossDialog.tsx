import { format, parseISO } from 'date-fns'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  describeEffect,
  describeEffectLong,
  bestiaryMechanic,
  RESOURCE_LABEL,
  rewardMultiplier,
  type BossSummary,
} from '../lib/bosses'
import { CURSES } from '../lib/curses'
import { RELICS } from '../lib/relics'
import { soulDefinition } from '../lib/souls'
import {
  COIN,
  COIN_PALETTE,
  DIAMOND,
  GOLD_GEM_PALETTE,
  HEART,
  HEART_PALETTE,
} from '../lib/pixelArt'
import { usePlayerStore } from '../store/usePlayerStore'
import type { BossResource, DeathStakePercent } from '../types'
import BossSprite from './BossSprite'
import Candle from './Candle'
import CastleSilhouette from './CastleSilhouette'
import Ornament from './Ornament'
import PixelArt from './PixelArt'

export type BossDialogMode = 'details' | 'intro' | 'result'

function dayLabel(dateKey: string): string {
  return format(parseISO(dateKey), 'dd/MM')
}

function itemsText(items: Partial<Record<BossResource, number>>): string {
  return Object.entries(items)
    .filter(([, quantity]) => (quantity ?? 0) > 0)
    .map(([resource, quantity]) => `${quantity} × ${RESOURCE_LABEL[resource as BossResource].toLowerCase()}`)
    .join(', ')
}

function headline(summary: BossSummary, mode: BossDialogMode): string | null {
  const { encounter, definition } = summary
  if (encounter.status === 'victory' && mode === 'result') {
    const rewards = encounter.rewards
    if (!rewards) return `¡Has vencido ${definition.grammar.object}!`
    const items = itemsText(rewards.items)
    const souls = Object.values(rewards.souls ?? {})
      .map((award) => {
        const label = award.repeated
          ? award.upgraded ? `rango ${award.rank}` : `fragmento (${award.rank}/3)`
          : 'rango 1'
        return `${soulDefinition(award.id).name} (${label})`
      })
      .join(', ')
    const relics = (rewards.relics ?? []).map((id) => RELICS[id].name).join(', ')
    const extras = [items, souls, relics].filter(Boolean).join(', ')
    return `¡Has vencido ${definition.grammar.object}! Recibes ${rewards.xp} EXP, ${rewards.coins} monedas${extras ? ` y ${extras}` : ''}.`
  }
  if (encounter.status === 'defeat' && mode === 'result') {
    const curse = encounter.curse ? ` Te alcanza la maldición ${CURSES[encounter.curse].name}.` : ''
    const verb = definition.grammar.plural ? 'se retiran' : 'se retira'
    const consequence = definition.defeatText ?? `Pierdes ${definition.defeatDamage} de vida`
    return `${definition.grammar.subject} ${verb} tras el combate: ${consequence}.${curse}`
  }
  if (mode === 'intro') return `${definition.grammar.subject} ${definition.grammar.plural ? 'rondan' : 'ronda'} el castillo.`
  return null
}

function stateText(summary: BossSummary): string {
  switch (summary.encounter.status) {
    case 'active': return summary.daysLeft === 1 ? 'Activo · último día' : `Activo · quedan ${summary.daysLeft} días`
    case 'victory': return 'Vencido'
    case 'defeat': return 'Te derrotó'
    default: return 'Dormido'
  }
}

function Plate({ label, value, tone = 'text-gold-300' }: Readonly<{ label: string; value: string; tone?: string }>) {
  return (
    <div className="cv-plate flex flex-col items-center justify-center gap-1 px-1 py-2 text-center">
      <span className="cv-label text-[0.8rem]">{label}</span>
      <span className={`font-pixel text-2xl leading-none ${tone}`}>{value}</span>
    </div>
  )
}

function Rule({ icon, title, children }: Readonly<{ icon: ReactNode; title: string; children: ReactNode }>) {
  return (
    <li className="flex items-start gap-3">
      <span className="cv-plate flex h-11 w-11 shrink-0 items-center justify-center" aria-hidden>{icon}</span>
      <div className="min-w-0">
        <p className="cv-label text-gold-400">{title}</p>
        <p className="mt-0.5 font-body text-[0.95rem] leading-snug text-silver-300">{children}</p>
      </div>
    </li>
  )
}

/** Tarjeta informativa: nunca concede ni cambia nada, solo explica el encuentro. */
function BossDialog({
  summary,
  mode = 'details',
  onClose,
  onDeathStake,
}: Readonly<{
  summary: BossSummary
  mode?: BossDialogMode
  onClose: () => void
  onDeathStake?: (percent: DeathStakePercent) => Promise<boolean>
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [stakePending, setStakePending] = useState(false)
  const level = usePlayerStore((s) => s.profile?.level ?? 1)
  const { definition, encounter, completedDates, target, today, kind, bars, damage, goal, statuesBroken, statuesMissed } = summary
  const active = encounter.status === 'active'
  const notice = headline(summary, mode)
  const multiplier = rewardMultiplier(level)
  const objective = definition.objective
  const dropLabels = definition.drops
    .map((drop) => (drop.item === 'goldBag' ? 'bolsa de oro' : RESOURCE_LABEL[drop.item].toLowerCase()))
    .join(', ')

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="boss-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      className="m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-md border-0 bg-transparent p-0 backdrop:bg-black/80"
    >
      <section className={`cv-panel ${active ? 'cv-panel--blood' : 'cv-panel--gold'} max-h-[92dvh] overflow-y-auto p-0`}>
        <div className="cv-sky relative h-52 overflow-hidden border-b-2 border-gold-600/60">
          <CastleSilhouette className="absolute inset-0 opacity-95" />
          <div className="cv-moon absolute top-5 left-1/2 h-24 w-24 -translate-x-1/2" />
          <div className="absolute inset-0 flex items-center justify-center pb-4">
            <BossSprite bossId={definition.id} scale={definition.id === 'giant-bat' ? 4 : 3} className="cv-boss-float" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-night-950 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="cv-btn absolute top-2 right-2 px-2 py-1 text-base"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 px-4 pt-3 pb-4">
          <header className="text-center">
            <p className="cv-label">Encuentro con boss · {definition.mechanic}</p>
            <h2 id="boss-dialog-title" className="cv-title mt-1 text-4xl">{definition.name}</h2>
            <Ornament className="mt-2" />
            <p className={`cv-tag cv-tag--still mt-3 inline-block ${active ? 'cv-tag--blood' : 'cv-tag--gold'}`}>{stateText(summary)}</p>
          </header>

          {notice && (
            <p className="cv-plate px-3 py-2 text-center font-body text-lg leading-snug text-gold-300">{notice}</p>
          )}

          {active && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Plate label="Plazo" value={summary.daysLeft === 1 ? 'Hoy' : `${summary.daysLeft} días`} />
                <Plate
                  label="Efecto"
                  value={definition.effects[0] ? describeEffect(definition.effects[0]) : '—'}
                  tone="text-blood-400"
                />
                {kind === 'days' ? (
                  <Plate label="Hoy" value={today.due === 0 ? '—' : `${today.done}/${today.due}`} />
                ) : (
                  <Plate
                    label={kind === 'pieces'
                      ? 'Piezas'
                      : kind === 'lifeSteal'
                        ? 'Sangre'
                        : kind === 'scythes'
                          ? 'Hoces'
                          : kind === 'statues'
                            ? 'Estatuas'
                            : 'Golpes'}
                    value={`${damage}/${goal}`}
                  />
                )}
              </div>

              {kind === 'days' ? (
                <section aria-label="Progreso">
                  <p className="cv-label text-center">Días con todas las obligaciones cumplidas</p>
                  <div className="mt-2 flex items-end justify-center gap-8">
                    {Array.from({ length: target }, (_, index) => (
                      <div key={index} className="flex flex-col items-center gap-1">
                        <Candle lit={index < completedDates.length} scale={4} />
                        <span className="font-pixel text-lg leading-none text-silver-500">
                          {completedDates[index] ? dayLabel(completedDates[index]) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="sr-only">{completedDates.length} de {target} días conseguidos.</p>
                  <p className="mt-2 text-center font-body text-sm text-silver-500 italic">
                    {today.due === 0
                      ? 'Hoy no hay obligaciones que cuenten para el boss.'
                      : `Hoy llevas ${today.done} de ${today.due} obligaciones.`}
                  </p>
                </section>
              ) : (
                <section
                  aria-label={
                    kind === 'pieces'
                      ? 'Piezas del boss'
                      : kind === 'lifeSteal'
                        ? 'Sangre robada'
                        : kind === 'scythes'
                          ? 'Hoces acumuladas'
                            : kind === 'statues'
                              ? 'Estatuas de Medusa'
                              : 'Vida del boss'
                  }
                  className="flex flex-col gap-2"
                >
                  {bars.map((bar) => (
                    <div key={bar.name}>
                      <div className="mb-1 flex justify-between font-pixel text-base leading-none text-silver-300">
                        <span>{bar.name}</span>
                        <span>{bar.hp}/{bar.max}</span>
                      </div>
                      <div
                        className="cv-bar"
                        role="progressbar"
                        aria-label={
                          kind === 'pieces'
                            ? `Estado de la pieza de ${bar.name}`
                            : kind === 'lifeSteal'
                              ? `Sangre robada de ${bar.name}`
                              : kind === 'scythes'
                                ? `Hoces acumuladas de ${bar.name}`
                                : kind === 'statues'
                                  ? `Estatuas rotas de ${bar.name}`
                                  : `Vida de ${bar.name}`
                        }
                        aria-valuemin={0}
                        aria-valuemax={bar.max}
                        aria-valuenow={bar.hp}
                      >
                        <span className="cv-fill-hp" style={{ width: `${bar.max ? (bar.hp / bar.max) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                  {objective.kind === 'hits' && (
                    <p className="mt-1 text-center font-pixel text-base leading-none text-silver-500">
                      Golpe: trivial {objective.damage.trivial} · fácil {objective.damage.easy} · media {objective.damage.medium} · difícil {objective.damage.hard}
                    </p>
                  )}
                  {objective.kind === 'lifeSteal' && (
                    <p className="mt-1 text-center font-pixel text-base leading-none text-silver-500">
                      Recuperación: trivial {objective.recovery.trivial} · fácil {objective.recovery.easy} · media {objective.recovery.medium} · difícil {objective.recovery.hard}
                    </p>
                  )}
                  {objective.kind === 'statues' && (
                    <p className="mt-1 text-center font-pixel text-base leading-none text-silver-500">
                      Rotas: {statuesBroken} · sin romper: {statuesMissed} · cada deuda cura a Medusa
                    </p>
                  )}
                </section>
              )}
            </>
          )}

          {active && definition.id === 'death' && encounter.stakePercent === undefined && onDeathStake && (
            <section className="cv-plate flex flex-col gap-2 p-3" aria-label="Apuesta de Death">
              <p className="cv-label text-center text-gold-400">Elige tu apuesta de oro</p>
              <p className="text-center font-body text-sm text-silver-300">
                Se descuenta ahora y se devuelve por 2 si hay hoces, o por 3 si no hay ninguna.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[0, 10, 25].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    disabled={stakePending}
                    onClick={() => {
                      setStakePending(true)
                      void onDeathStake(percent as DeathStakePercent).finally(() => setStakePending(false))
                    }}
                    className="cv-btn cv-btn--gold px-2 py-2"
                  >
                    {percent} %
                  </button>
                ))}
              </div>
            </section>
          )}

          <ul className="flex flex-col gap-3">
            {definition.effects.length > 0 && (
              <Rule icon={<span className="font-pixel text-2xl text-blood-400">☾</span>} title="Entorno">
                {definition.effects.map(describeEffectLong).join(' ')}
              </Rule>
            )}
            <Rule icon={<PixelArt rows={DIAMOND} palette={GOLD_GEM_PALETTE} scale={3} />} title="Cómo vencerlo">
              {objective.kind === 'days' ? (
                <>
                  Cumple todas las obligaciones recurrentes y pergaminos que vencen ese día (al menos una) en {objective.targetDays} días,
                  seguidos o no, dentro de {definition.windowDays} días. Hábitos y misiones secundarias no cuentan.
                </>
              ) : objective.kind === 'pieces' ? (
                <>
                  {bestiaryMechanic(definition)} Debes desactivar todas las piezas seleccionadas en {definition.windowDays} días.
                </>
              ) : objective.kind === 'lifeSteal' ? (
                <>
                  {bestiaryMechanic(definition)} Debes recuperar toda la sangre robada antes de que termine la ventana de {definition.windowDays} días.
                </>
              ) : objective.kind === 'scythes' ? (
                <>
                  {bestiaryMechanic(definition)} La ventana dura {definition.windowDays} días.
                </>
              ) : (
                <>
                  {bestiaryMechanic(definition)} Debes agotar su vida ({goal || 'según tu carga'})
                  en {definition.windowDays} días.
                </>
              )}
            </Rule>
            <Rule icon={<PixelArt rows={HEART} palette={HEART_PALETTE} scale={3} />} title="Si fallas">
              {definition.defeatText ?? `Al acabar el plazo recibes ${definition.defeatDamage} de daño directo: ninguna defensa lo detiene.`}
              {definition.defeatText ? '.' : ''}
              {definition.defeatCurse && (
                <> Además te alcanza la maldición <strong>{CURSES[definition.defeatCurse.id].name}</strong>
                  {definition.defeatCurse.permanent
                    ? `: ${CURSES[definition.defeatCurse.id].description.toLowerCase()}`
                    : ` durante ${definition.defeatCurse.days} días: ${CURSES[definition.defeatCurse.id].description.toLowerCase()}`}</>
              )}
            </Rule>
            <Rule icon={<PixelArt rows={COIN} palette={COIN_PALETTE} scale={3} />} title="Recompensa">
              {Math.round(definition.reward.xp * multiplier)} EXP y {Math.round(definition.reward.coins * multiplier)} monedas,
              más objetos al azar: {dropLabels}.
            </Rule>
          </ul>

          {!active && (
            <p className="text-center font-body text-sm text-silver-500 italic">
              Tras cada encuentro descansa un tiempo y vuelve a rondar el castillo.
            </p>
          )}

          <button type="button" onClick={onClose} className="cv-btn cv-btn--gold w-full">
            Entendido
          </button>
        </div>
      </section>
    </dialog>
  )
}

export default BossDialog
