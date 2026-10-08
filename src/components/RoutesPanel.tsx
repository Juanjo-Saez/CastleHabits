import { format, parseISO } from 'date-fns'
import { todayKey } from '../lib/date'
import {
  hasShield,
  MAX_ROUTE_LEVEL,
  passivePercent,
  ROUTE_IDS,
  ROUTES,
  routeStatus,
  type RouteDef,
} from '../lib/routes'
import { startRoute } from '../store/routeActions'
import { useItemsStore } from '../store/useItemsStore'
import { usePlayerStore } from '../store/usePlayerStore'
import SectionTitle from './SectionTitle'

function ShieldLine() {
  const shieldReadyOn = usePlayerStore((s) => s.profile?.shieldReadyOn)
  const recharging = shieldReadyOn !== undefined && shieldReadyOn > todayKey()
  return (
    <p className="font-body text-sm text-gold-300 italic">
      {recharging
        ? `Escudo gastado: vuelve el ${format(parseISO(shieldReadyOn), 'dd/MM')}.`
        : 'Escudo listo: absorberá el próximo fallo.'}
    </p>
  )
}

function RouteCard({ def }: Readonly<{ def: RouteDef }>) {
  const profile = usePlayerStore((s) => s.profile)
  const equipRoute = usePlayerStore((s) => s.equipRoute)
  const items = useItemsStore((s) => s.items)
  const completionsByItem = useItemsStore((s) => s.completionsByItem)
  if (!profile) return null

  const progress = profile.routes[def.id]
  const started = Boolean(progress.windowStart)
  const equipped = profile.equippedRoute === def.id
  const status = routeStatus(def, progress, items, completionsByItem, todayKey())
  const nextPercent = passivePercent(progress.level + 1)
  const goodPct = Math.min(100, (status.goodDays / status.rule.goodDays) * 100)

  return (
    <div className={`cv-panel ${equipped ? 'cv-panel--gold' : ''} flex flex-col gap-2 p-3`}>
      <div className="flex items-start gap-2">
        <span className="text-3xl leading-none" aria-hidden>{def.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="cv-shadow font-pixel text-2xl leading-none text-silver-100">{def.name}</p>
          <p className="mt-1 font-body text-sm text-silver-500 italic">{def.summary}</p>
        </div>
        {equipped && <span className="cv-tag cv-tag--gold">Equipado</span>}
      </div>

      <p className="font-body text-sm text-silver-300">
        {progress.level > 0
          ? `Nivel ${progress.level}/${MAX_ROUTE_LEVEL}: ${def.passive(passivePercent(progress.level))}`
          : `Pasiva bloqueada: ${def.passive(passivePercent(1))} al completar el primer tramo.`}
      </p>

      {started ? (
        <>
          {status.maxed ? (
            <p className="font-pixel text-lg leading-none text-gold-300">Ruta al máximo</p>
          ) : (
            <div>
              <div className="mb-1 flex justify-between font-pixel text-sm text-silver-500">
                <span>TRAMO {status.tier} · DÍA {status.dayInWindow}/{status.rule.windowDays}</span>
                <span>{status.goodDays}/{status.rule.goodDays} días buenos</span>
              </div>
              <div className="cv-bar"><span className="cv-fill-mp" style={{ width: `${goodPct}%` }} /></div>
              <p className="mt-1 font-body text-sm text-silver-500 italic">
                Un día es bueno con {status.rule.minPerDay} actividades distintas (hoy {status.doneToday}).
                {` Al completar: ${def.passive(nextPercent)}.`}
              </p>
            </div>
          )}

          {equipped && hasShield(profile) && <ShieldLine />}

          {progress.level > 0 && (
            <button
              type="button"
              onClick={() => void equipRoute(equipped ? null : def.id)}
              className={`cv-btn px-2 py-1 text-base ${equipped ? '' : 'cv-btn--gold'}`}
            >
              {equipped ? 'Desequipar' : 'Equipar oficio'}
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={() => void startRoute(def.id)}
          className="cv-btn cv-btn--gold px-2 py-1 text-base"
        >
          Iniciar ruta
        </button>
      )}
    </div>
  )
}

function RoutesPanel() {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Rutas y oficios</SectionTitle>
      <p className="font-body text-sm text-silver-500 italic">
        Completa tramos de 30 días para desbloquear y mejorar la pasiva. Solo un oficio puede estar equipado.
      </p>
      {ROUTE_IDS.map((id) => <RouteCard key={id} def={ROUTES[id]} />)}
    </div>
  )
}

export default RoutesPanel
