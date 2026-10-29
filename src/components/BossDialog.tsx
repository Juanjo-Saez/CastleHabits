import { format, parseISO } from 'date-fns'
import { useEffect, useRef, type ReactNode } from 'react'
import { RESOURCE_LABEL, type BossSummary } from '../lib/bosses'
import {
  COIN,
  COIN_PALETTE,
  DIAMOND,
  GIANT_BAT,
  GIANT_BAT_PALETTE,
  GOLD_GEM_PALETTE,
  HEART,
  HEART_PALETTE,
} from '../lib/pixelArt'
import Candle from './Candle'
import CastleSilhouette from './CastleSilhouette'
import Ornament from './Ornament'
import PixelArt from './PixelArt'

export type BossDialogMode = 'details' | 'intro' | 'result'

function dayLabel(dateKey: string): string {
  return format(parseISO(dateKey), 'dd/MM')
}

function headline(summary: BossSummary, mode: BossDialogMode): string | null {
  const { encounter, definition } = summary
  if (encounter.status === 'victory' && mode === 'result') {
    const resource = encounter.rewardResource ? ` y ${RESOURCE_LABEL[encounter.rewardResource].toLowerCase()}` : ''
    return `¡Has vencido al ${definition.name}! Recibes ${definition.reward.xp} EXP, ${definition.reward.coins} monedas${resource}.`
  }
  if (encounter.status === 'defeat' && mode === 'result') {
    return `El ${definition.name} se retira tras herirte: pierdes ${definition.defeatDamage} de vida.`
  }
  if (mode === 'intro') return `Un ${definition.name.toLowerCase()} ronda el castillo.`
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
}: Readonly<{ summary: BossSummary; mode?: BossDialogMode; onClose: () => void }>) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { definition, encounter, completedDates, target, today } = summary
  const active = encounter.status === 'active'
  const notice = headline(summary, mode)

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
          <div className="cv-stars absolute inset-0" />
          <div className="cv-moon absolute top-5 left-1/2 h-24 w-24 -translate-x-1/2" />
          <CastleSilhouette className="absolute inset-x-0 bottom-0 h-32 w-full opacity-95" />
          <div className="absolute inset-0 flex items-center justify-center pb-4">
            <PixelArt rows={GIANT_BAT} palette={GIANT_BAT_PALETTE} scale={4} className="cv-boss-float" />
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
            <p className="cv-label">Encuentro con boss</p>
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
                <Plate label="Efecto" value={`EXP −${100 - definition.xpPercent}%`} tone="text-blood-400" />
                <Plate label="Hoy" value={today.due === 0 ? '—' : `${today.done}/${today.due}`} />
              </div>

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
            </>
          )}

          <ul className="flex flex-col gap-3">
            <Rule icon={<PixelArt rows={DIAMOND} palette={GOLD_GEM_PALETTE} scale={3} />} title="Cómo vencerlo">
              Cumple todas las obligaciones recurrentes y pergaminos que vencen ese día (al menos una) en {definition.targetDays} días,
              seguidos o no, dentro de {definition.windowDays} días. Hábitos y misiones secundarias no cuentan.
            </Rule>
            <Rule icon={<PixelArt rows={HEART} palette={HEART_PALETTE} scale={3} />} title="Si fallas">
              Al acabar el plazo recibes {definition.defeatDamage} de daño directo: ninguna defensa lo detiene.
            </Rule>
            <Rule icon={<PixelArt rows={COIN} palette={COIN_PALETTE} scale={3} />} title="Recompensa">
              {definition.reward.xp} EXP, {definition.reward.coins} monedas y un recurso al azar: sello de aplazamiento,
              poción de vigor o congelación de racha.
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
