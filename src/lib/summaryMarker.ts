const SHOWN_KEY = 'habitos.dailySummary.shownFor'

type MarkerStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function defaultStorage(): MarkerStorage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

/**
 * Marca local (no forma parte del perfil ni del backup) del día cuyo resumen ya se abrió
 * automáticamente. Abrir el resumen a mano no la modifica.
 */
export function hasShownSummary(date: string, storage: MarkerStorage | null = defaultStorage()): boolean {
  try {
    return storage?.getItem(SHOWN_KEY) === date
  } catch {
    return false
  }
}

export function markSummaryShown(date: string, storage: MarkerStorage | null = defaultStorage()): void {
  try {
    storage?.setItem(SHOWN_KEY, date)
  } catch {
    // Sin almacenamiento disponible: el resumen podría repetirse, pero nunca se pierde.
  }
}

export function clearSummaryMarker(storage: MarkerStorage | null = defaultStorage()): void {
  try {
    storage?.removeItem(SHOWN_KEY)
  } catch {
    // Nada que limpiar.
  }
}
