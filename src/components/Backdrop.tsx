import type { CSSProperties } from 'react'
import { activeEncounter } from '../lib/bosses'
import { todayKey } from '../lib/date'
import { BAT_A, BAT_B, BAT_PALETTE } from '../lib/pixelArt'
import { effectiveMaxHp } from '../lib/routes'
import { weatherForDay } from '../lib/weather'
import { useBossStore } from '../store/useBossStore'
import { usePlayerStore } from '../store/usePlayerStore'
import CastleSilhouette from './CastleSilhouette'
import PixelArt from './PixelArt'

const BATS = [
  { top: '18%', duration: '19s', delay: '0s', scale: 3 },
  { top: '30%', duration: '26s', delay: '-9s', scale: 2 },
  { top: '12%', duration: '32s', delay: '-20s', scale: 2 },
]

function Backdrop() {
  const bossActive = useBossStore((s) => Boolean(activeEncounter(s.encounters)))
  const dailyWeather = weatherForDay(todayKey())
  const weather = bossActive ? 'boss' : dailyWeather
  const hpRatio = usePlayerStore((s) =>
    s.profile ? s.profile.hp / effectiveMaxHp(s.profile) : 1,
  )
  const bloodMoon = hpRatio < 0.3 || bossActive

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden cv-sky cv-weather cv-weather--${weather}`}
      data-weather={weather}
      aria-hidden
    >
      <div className="cv-stars absolute inset-0" />
      <div className="cv-cloud-layer absolute inset-0" />
      {/* El castillo ocupa todo el ancho y recorta sus laterales alrededor de la torre central. */}
      <CastleSilhouette
        className="absolute inset-x-0 bottom-0 z-0"
        style={{ height: 'var(--castle-h)' }}
      />
      {/* La luna se ancla a la columna de la app para que el boss del Castillo coincida con ella. */}
      <div className="absolute inset-0 mx-auto max-w-md">
        <div
          className={`cv-moon cv-moon-spot cv-backdrop-moon absolute h-28 w-28 ${
            bloodMoon ? 'cv-moon--blood' : dailyWeather === 'eclipse' ? 'cv-moon--eclipse' : ''
          }`}
        />
      </div>

      {dailyWeather !== 'clear' && !bossActive && <div className="cv-weather-haze absolute inset-0" />}
      {(dailyWeather === 'rain' || dailyWeather === 'storm') && !bossActive && (
        <div className="cv-rain-layer absolute inset-0" />
      )}
      {bossActive && (
        <div className="cv-boss-storm" aria-hidden>
          <span />
          <span />
        </div>
      )}

      {BATS.map((bat) => (
        <div
          key={bat.top}
          className="cv-bat"
          style={
            {
              top: bat.top,
              '--bat-duration': bat.duration,
              '--bat-delay': bat.delay,
            } as CSSProperties
          }
        >
          <div className="relative">
            <PixelArt rows={BAT_A} palette={BAT_PALETTE} scale={bat.scale} className="cv-bat-a" />
            <PixelArt rows={BAT_B} palette={BAT_PALETTE} scale={bat.scale} className="cv-bat-b" />
          </div>
        </div>
      ))}

      {(dailyWeather === 'fog' || dailyWeather === 'storm' || bossActive) && (
        <div className="cv-fog absolute -left-1/4 bottom-0 h-48 w-[150%]" />
      )}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night-950 to-transparent" />
    </div>
  )
}

export default Backdrop
