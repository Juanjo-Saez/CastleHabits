const SEEN_KEY = 'habitos.boss.seen'
const MAX_TOKENS = 30

type MarkerStorage = Pick<Storage, 'getItem' | 'setItem'>

function defaultStorage(): MarkerStorage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function readTokens(storage: MarkerStorage | null): string[] {
  try {
    const raw = storage?.getItem(SEEN_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((token): token is string => typeof token === 'string') : []
  } catch {
    return []
  }
}

/** Aviso ya mostrado de un encuentro (p. ej. `createdAt:active`). Es una preferencia local, fuera del backup. */
export function hasSeenBossNotice(token: string, storage: MarkerStorage | null = defaultStorage()): boolean {
  return readTokens(storage).includes(token)
}

export function markBossNoticeSeen(token: string, storage: MarkerStorage | null = defaultStorage()): void {
  try {
    const tokens = readTokens(storage)
    if (tokens.includes(token)) return
    storage?.setItem(SEEN_KEY, JSON.stringify([...tokens, token].slice(-MAX_TOKENS)))
  } catch {
    // Sin almacenamiento: el aviso podría repetirse, pero el juego no se ve afectado.
  }
}
