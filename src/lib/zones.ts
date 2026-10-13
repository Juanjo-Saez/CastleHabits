export const ZONES = [
  { name: 'Marble Gallery', home: 'Galería' },
  { name: 'Outer Wall', home: 'Balcón' },
  { name: 'Crimson Hall', home: 'Comedor' },
  { name: 'Castle Corridor', home: 'Pasillo' },
  { name: 'Catacombs', home: 'Cacódromo' },
  { name: 'Lost Library', home: 'Escritorio' },
  { name: 'Alchemy Laboratory', home: 'Cocina' },
  { name: 'Underground Caverns', home: 'Baño' },
  { name: 'Castle Keep', home: 'Dormitorio' },
  { name: 'Castle', home: 'Hogar' },
] as const

export function migrateLegacyZone(value: string | undefined): string | undefined {
  if (!value) return value
  const normalized = value.trim().toLocaleLowerCase('es')
  const matchingZone = ZONES.find(
    (zone) =>
      zone.name.toLocaleLowerCase('en') === normalized ||
      zone.home.toLocaleLowerCase('es') === normalized,
  )
  if (matchingZone) return matchingZone.name
  if (normalized === 'toda la casa') return 'Castle'
  return value
}