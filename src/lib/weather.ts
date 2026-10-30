import { todayKey } from './date'

export type WeatherKind = 'clear' | 'clouded' | 'fog' | 'rain' | 'storm' | 'eclipse'

export interface WeatherProfile {
  kind: WeatherKind
  label: string
  description: string
  weight: number
}

export const WEATHER_PROFILES: readonly WeatherProfile[] = [
  { kind: 'clear', label: 'Cielo despejado', description: 'La luna ilumina las torres bajo un cielo despejado.', weight: 45 },
  { kind: 'clouded', label: 'Cielo nublado', description: 'Las nubes altas velan parte de las estrellas.', weight: 20 },
  { kind: 'fog', label: 'Niebla', description: 'La niebla se acumula alrededor de las murallas.', weight: 15 },
  { kind: 'rain', label: 'Lluvia', description: 'Una lluvia fina cae sobre el Castillo.', weight: 12 },
  { kind: 'storm', label: 'Tormenta', description: 'Las nubes de tormenta cubren el cielo.', weight: 6 },
  { kind: 'eclipse', label: 'Eclipse', description: 'Un eclipse extraño oscurece la luz de la luna.', weight: 2 },
]

const WEATHER_SEED_KEY = 'castlehabits.weather-seed.v1'
let sessionSeed: string | null = null

function randomSeed(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  } catch {
    // A session seed is still enough when the browser does not expose crypto.
  }
  return `${Date.now()}-${Math.random()}`
}

function browserStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function weatherSeed(storage: Storage | null = browserStorage()): string {
  if (sessionSeed) return sessionSeed
  try {
    const stored = storage?.getItem(WEATHER_SEED_KEY)
    if (stored) {
      sessionSeed = stored
      return stored
    }
    const created = randomSeed()
    storage?.setItem(WEATHER_SEED_KEY, created)
    sessionSeed = created
    return created
  } catch {
    sessionSeed = randomSeed()
    return sessionSeed
  }
}

function hash(value: string): number {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

export function selectWeather(dateKey: string, seed: string): WeatherKind {
  const totalWeight = WEATHER_PROFILES.reduce((total, profile) => total + profile.weight, 0)
  let target = hash(`${seed}:${dateKey}`) % totalWeight
  for (const profile of WEATHER_PROFILES) {
    if (target < profile.weight) return profile.kind
    target -= profile.weight
  }
  return WEATHER_PROFILES[WEATHER_PROFILES.length - 1].kind
}

export function weatherForDay(dateKey: string = todayKey(), seed = weatherSeed()): WeatherKind {
  return selectWeather(dateKey, seed)
}

export function isEclipseDay(dateKey: string, seed?: string): boolean {
  return weatherForDay(dateKey, seed) === 'eclipse'
}

export function eclipseMultiplierForDay(dateKey: string, seed?: string): number {
  return isEclipseDay(dateKey, seed) ? 2 : 1
}

export function weatherProfile(kind: WeatherKind): WeatherProfile {
  return WEATHER_PROFILES.find((profile) => profile.kind === kind) ?? WEATHER_PROFILES[0]
}

export function resetWeatherSeedForTests(): void {
  sessionSeed = null
}
