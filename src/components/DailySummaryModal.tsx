import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { xpToNextLevel } from '../lib/gamification'
import type { DailySummary, SummaryRoute } from '../lib/dailySummary'
import { MAX_ROUTE_LEVEL } from '../lib/routes'
import { playCoinGain, playDamageThud, playLevelUpChime, playSummaryOpen } from '../lib/sound'
import { useDailySummaryStore } from '../store/useDailySummaryStore'
import SectionTitle from './SectionTitle'

/** Etapas: 0 apertura, 1 crónica, 2 balance, 3 progreso, 4 secuencia terminada. */
const LAST_STAGE = 4
const STAGE_MS = 1100
const COUNT_MS = 900

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function useSequence(instant: boolean): number {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    if (instant || stage >= LAST_STAGE) return
    const timer = window.setTimeout(() => setStage((current) => current + 1), STAGE_MS)
    return () => window.clearTimeout(timer)
  }, [stage, instant])
  return instant ? LAST_STAGE : stage
}

function useCountUp(target: number, active: boolean, instant: boolean): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active || instant) return
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_MS)
      setValue(Math.round(target * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, active, instant])
  if (instant) return target
  return active ? value : 0
}

function Section({ shown, children }: Readonly<{ shown: boolean; children: ReactNode }>) {
  return (
    <section data-shown={shown} className="cv-summary-section flex flex-col gap-2">
      {children}
    </section>
  )
}

function Bar({ from, to, active, instant, fill, label }: Readonly<{
  from: number
  to: number
  active: boolean
  instant: boolean
  fill: string
  label: string
}>) {
  const width = active || instant ? to : from
  return (
    <div className="cv-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(to)}>
      <span className={fill} style={{ width: `${width}%`, transitionDuration: instant ? '0ms' : '1400ms' }} />
    </div>
  )
}

function Tile({ label, value, prefix, tone, active, instant }: Readonly<{
  label: string
  value: number
  prefix: string
  tone: string
  active: boolean
  instant: boolean
}>) {
  const shown = useCountUp(value, active, instant)
  return (
    <div className="cv-panel p-2 text-center">
      <p className="cv-label">{label}</p>
      <p className={`mt-1 font-pixel text-3xl ${tone}`}>
        <span aria-hidden="true">{value === 0 ? '' : prefix}{shown}</span>
        <span className="sr-only">{value === 0 ? 0 : `${prefix}${value}`}</span>
      </p>
    </div>
  )
}

function flavor(summary: DailySummary): string {
  if (summary.damage > 0) return 'La oscuridad cobró su precio mientras dormías.'
  if (summary.missed.length > 0) return 'Tus defensas resistieron lo que no pudiste cumplir.'
  if (summary.done.length > 0) return 'La noche te fue favorable.'
  return 'Una noche tranquila en el castillo.'
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

function describe(summary: DailySummary): string {
  const parts = [
    plural(summary.done.length, 'actividad cumplida', 'actividades cumplidas'),
    plural(summary.missed.length, 'obligación sin cumplir', 'obligaciones sin cumplir'),
    `${summary.xpGained} de EXP y ${summary.coinsGained} de oro ganados`,
    `${summary.damage} de vida perdida`,
  ]
  const vitals = summary.vitals
  if (vitals?.levelsGained) parts.push(`subiste del nivel ${vitals.levelBefore} al ${vitals.levelAfter}`)
  return parts.join('. ')
}

function RouteCard({ route, active, instant }: Readonly<{ route: SummaryRoute; active: boolean; instant: boolean }>) {
  const percent = route.requiredGoodDays > 0 ? (route.goodDays / route.requiredGoodDays) * 100 : 0
  return (
    <li className="flex flex-col gap-1 border-t border-gold-600/20 pt-2 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate font-pixel text-xl text-silver-100">
          <span aria-hidden="true">{route.icon} </span>{route.name}
        </span>
        <span className="shrink-0 font-pixel text-base text-gold-300">
          {route.levelAfter > 0 ? `Pasiva nivel ${route.levelAfter}/${MAX_ROUTE_LEVEL}` : 'Pasiva sin desbloquear'}
        </span>
      </div>
      {route.maxed ? (
        <p className="font-body text-sm text-gold-300 italic">Ruta completada: la pasiva está al máximo.</p>
      ) : (
        <>
          <Bar
            from={0}
            to={Math.min(100, percent)}
            active={active}
            instant={instant}
            fill="cv-fill-exp"
            label={`Días buenos de ${route.name}`}
          />
          <p className="font-body text-sm text-silver-300">
            {route.goodDays} de {route.requiredGoodDays} días buenos · ayer {route.activities} de {route.minPerDay} actividades
            {route.goodDay ? ' (día bueno)' : ' (no fue día bueno)'}
          </p>
        </>
      )}
      {route.levelUp && (
        <p className="font-pixel text-lg text-gold-300">
          ¡Tramo completado!{route.levelBefore === 0 && route.passiveName ? ` Desbloqueas «${route.passiveName}».` : ''}
        </p>
      )}
    </li>
  )
}

function SummaryContent({ summary, onClose, onReplay }: Readonly<{
  summary: DailySummary
  onClose: () => void
  onReplay: () => void
}>) {
  const navigate = useNavigate()
  const [skipped, setSkipped] = useState(false)
  const [reduced] = useState(prefersReducedMotion)
  const instant = skipped || reduced
  const stage = useSequence(instant)
  const balanceActive = stage >= 2
  const progressActive = stage >= 3
  const vitals = summary.vitals

  useEffect(() => {
    if (instant) return
    const timers: number[] = []
    if (stage === 0) playSummaryOpen()
    if (stage === 2) {
      if (summary.xpGained > 0 || summary.coinsGained > 0) playCoinGain()
      if (summary.damage > 0) timers.push(window.setTimeout(playDamageThud, 450))
    }
    if (stage === 3 && vitals && vitals.levelsGained > 0) playLevelUpChime()
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [stage, instant, summary.xpGained, summary.coinsGained, summary.damage, vitals])

  const hpPercent = vitals ? Math.min(100, (vitals.hp / vitals.maxHp) * 100) : 0
  // Tras subir de nivel se aplica una curación parcial, así que la vida de partida no se puede deducir del daño.
  const hpBefore = vitals && vitals.levelsGained === 0
    ? Math.min(100, ((vitals.hp + summary.damage) / vitals.maxHp) * 100)
    : hpPercent

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <p id="summary-description" className="sr-only">{describe(summary)}</p>
        <div className="text-center">
          <p className="cv-label text-gold-300">Crónica de ayer</p>
          <h2 id="summary-title" className="cv-title mt-2 text-4xl first-letter:uppercase">
            {format(parseISO(summary.date), "EEEE d 'de' MMMM", { locale: es })}
          </h2>
          <p className="mt-2 font-body text-silver-300 italic">{flavor(summary)}</p>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <Section shown={stage >= 1}>
            <SectionTitle>Crónica</SectionTitle>
            <div>
              <p className="cv-label mb-1">Cumplidas ({summary.done.length})</p>
              {summary.done.length === 0 ? (
                <p className="font-body text-sm text-silver-500 italic">Ninguna actividad cumplida.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {summary.done.map((entry) => (
                    <li key={entry.id} className="flex items-baseline justify-between gap-2 font-body text-silver-100">
                      <span className="min-w-0 truncate">
                        {entry.title}
                        {entry.quantityDone !== undefined && (
                          <span className="text-silver-500"> · {entry.quantityDone} {entry.unit}</span>
                        )}
                      </span>
                      <span className="shrink-0 font-pixel text-base text-gold-300">+{entry.xp} EXP · +{entry.coins} oro</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="cv-label mb-1">Sin cumplir ({summary.missed.length})</p>
              {summary.missed.length === 0 ? (
                <p className="font-body text-sm text-gold-300 italic">Ninguna obligación quedó sin cumplir.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {summary.missed.map((miss) => (
                    <li key={miss.id} className="flex items-baseline justify-between gap-2 font-body text-silver-100">
                      <span className="min-w-0 truncate">{miss.title}</span>
                      {miss.protectedBy ? (
                        <span className="shrink-0 font-pixel text-base text-night-400">
                          Protegido · {miss.protectedBy === 'shield' ? 'escudo' : 'congelación'}
                        </span>
                      ) : (
                        <span className="shrink-0 font-pixel text-base text-blood-400">Daño: −{miss.damage} PV</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>

          <Section shown={stage >= 2}>
            <SectionTitle>Balance</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              <Tile label="EXP" value={summary.xpGained} prefix="+" tone="text-gold-300" active={balanceActive} instant={instant} />
              <Tile label="Oro" value={summary.coinsGained} prefix="+" tone="text-gold-300" active={balanceActive} instant={instant} />
              <Tile label="Vida" value={summary.damage} prefix="−" tone="text-blood-400" active={balanceActive} instant={instant} />
            </div>
            {vitals ? (
              <div className="flex flex-col gap-2">
                <div>
                  <div className="mb-1 flex justify-between font-pixel text-base text-silver-300">
                    <span>Nivel {vitals.levelAfter}</span>
                    <span>{vitals.xpAfter}/{xpToNextLevel(vitals.levelAfter)} EXP</span>
                  </div>
                  <Bar
                    from={vitals.levelsGained > 0 ? 0 : (vitals.xpBefore / xpToNextLevel(vitals.levelBefore)) * 100}
                    to={Math.min(100, (vitals.xpAfter / xpToNextLevel(vitals.levelAfter)) * 100)}
                    active={balanceActive}
                    instant={instant}
                    fill="cv-fill-exp"
                    label="Experiencia hacia el siguiente nivel"
                  />
                </div>
                <div>
                  <div className="mb-1 flex justify-between font-pixel text-base text-silver-300">
                    <span>Vida</span>
                    <span>{vitals.hp}/{vitals.maxHp} PV</span>
                  </div>
                  <Bar
                    from={hpBefore}
                    to={hpPercent}
                    active={balanceActive}
                    instant={instant}
                    fill="cv-fill-hp"
                    label="Vida al cerrar el día"
                  />
                </div>
              </div>
            ) : (
              <p className="font-body text-sm text-silver-500 italic">El estado del personaje de ese día no quedó registrado.</p>
            )}
          </Section>

          <Section shown={stage >= 3}>
            <SectionTitle>Progreso</SectionTitle>
            {vitals && vitals.levelsGained > 0 && (
              <div className="cv-panel cv-panel--gold relative overflow-hidden p-3 text-center">
                <div aria-hidden="true" className="cv-levelup-burst cv-levelup-rays" />
                <p className="cv-label relative text-gold-300">Ascensión</p>
                <p className="cv-title relative mt-1 text-4xl">Nivel {vitals.levelBefore} → {vitals.levelAfter}</p>
                <p className="relative mt-1 font-body text-silver-300 italic">
                  +{vitals.maxHpGain} de vida máxima · +50 % de vida máxima recuperada
                </p>
              </div>
            )}
            <div>
              <p className="cv-label mb-1">Rachas</p>
              {summary.streaks.length === 0 ? (
                <p className="font-body text-sm text-silver-500 italic">Sin rachas de 2 o más apariciones en marcha.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {summary.streaks.map((entry) => (
                    <li key={entry.id} className="flex items-baseline justify-between gap-2 font-body text-silver-100">
                      <span className="min-w-0 truncate">{entry.title}</span>
                      <span className="shrink-0 font-pixel text-base text-gold-400">Racha ×{entry.streak}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {summary.routes.length > 0 && (
              <div>
                <p className="cv-label mb-1">Rutas</p>
                <ul className="flex flex-col gap-2">
                  {summary.routes.map((route) => (
                    <RouteCard key={route.id} route={route} active={progressActive} instant={instant} />
                  ))}
                </ul>
              </div>
            )}
          </Section>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gold-600/30 p-3">
        {stage < LAST_STAGE ? (
          <button type="button" className="cv-btn cv-btn--ghost px-2 py-1" onClick={() => setSkipped(true)}>
            Saltar animación
          </button>
        ) : (
          <button type="button" className="cv-btn cv-btn--ghost px-2 py-1" onClick={onReplay}>
            Repetir animación
          </button>
        )}
        <button
          type="button"
          className="cv-btn px-2 py-1"
          onClick={() => {
            onClose()
            navigate(`/calendario?date=${summary.date}`)
          }}
        >
          Corregir ayer
        </button>
        <button type="button" className="cv-btn cv-btn--gold px-3 py-1" onClick={onClose}>
          Continuar
        </button>
      </div>
    </>
  )
}

const FOCUSABLE = 'button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'

function Dialog({ children, onClose }: Readonly<{ children: ReactNode; onClose: () => void }>) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    ref.current?.focus()
    return () => previous?.focus()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !ref.current) return
    const focusable = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === ref.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="cv-summary-backdrop fixed inset-0 z-50 flex items-center justify-center bg-night-950/95 p-3">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
        aria-describedby="summary-description"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="cv-panel cv-panel--gold flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col outline-none"
      >
        {children}
      </div>
    </div>
  )
}

/** Resumen de ayer: puramente de lectura. Ver, saltar o repetir la animación no cambia ningún dato de juego. */
function DailySummaryModal() {
  const open = useDailySummaryStore((s) => s.open)
  const loading = useDailySummaryStore((s) => s.loading)
  const summary = useDailySummaryStore((s) => s.summary)
  const error = useDailySummaryStore((s) => s.error)
  const close = useDailySummaryStore((s) => s.close)
  const [run, setRun] = useState(0)

  if (!open) return null

  const showSummary = !loading && !error && summary !== null
  let body: ReactNode
  if (loading) {
    body = <p role="status" className="p-6 text-center font-pixel text-xl text-silver-300">Consultando las crónicas…</p>
  } else if (error) {
    body = <p role="alert" className="p-6 text-center font-body text-blood-400">{error}</p>
  } else if (summary) {
    body = <SummaryContent key={run} summary={summary} onClose={close} onReplay={() => setRun((current) => current + 1)} />
  } else {
    body = (
      <p className="p-6 text-center font-body text-silver-300 italic">
        Aún no hay crónica de ayer: pertenece a una expedición anterior o todavía no habías empezado.
      </p>
    )
  }

  return (
    <Dialog onClose={close}>
      {!showSummary && <span id="summary-title" className="sr-only">Resumen de ayer</span>}
      {body}
      {!showSummary && (
        <div className="flex justify-end border-t border-gold-600/30 p-3">
          <button type="button" className="cv-btn cv-btn--gold px-3 py-1" onClick={close}>Cerrar</button>
        </div>
      )}
    </Dialog>
  )
}

export default DailySummaryModal
