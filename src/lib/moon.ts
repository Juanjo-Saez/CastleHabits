import type { WeatherKind } from './weather'

export type MoonAppearance = 'normal' | 'blood' | 'eclipse'

export function moonAppearance(hpRatio: number, bossActive: boolean, weather: WeatherKind): MoonAppearance {
  if (bossActive || hpRatio < 0.3) return 'blood'
  return weather === 'eclipse' ? 'eclipse' : 'normal'
}
