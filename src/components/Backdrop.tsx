import type { CSSProperties } from 'react'
import { activeEncounter } from '../lib/bosses'
import { todayKey } from '../lib/date'
import { BAT_A, BAT_B, BAT_PALETTE } from '../lib/pixelArt'
import { effectiveMaxHp } from '../lib/routes'
import { moonAppearance } from '../lib/moon'
import { weatherForDay } from '../lib/weather'
import { useBossStore } from '../store/useBossStore'
import { usePlayerStore } from '../store/usePlayerStore'
import CastleSilhouette from './CastleSilhouette'
import Moon from './Moon'
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
  const appearance = moonAppearance(hpRatio, bossActive, dailyWeather)

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden cv-sky cv-weather cv-weather--${weather}`}
      data-weather={weather}
      aria-hidden
    >
      <CastleSilhouette className="absolute inset-0 z-0" />
      <div className="cv-cloud-layer absolute inset-0" />
      {/* La luna se ancla a la columna de la app para que el boss del Castillo coincida con ella. */}
      <div className="absolute inset-0 mx-auto max-w-md">
        <Moon
          appearance={appearance}
          className="cv-moon-spot cv-backdrop-moon absolute h-20 w-20"
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
    </div>
  )
}

export default Backdrop
