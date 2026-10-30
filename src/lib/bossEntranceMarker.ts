const SEEN_KEY = 'habitos.boss.entrance.seen'
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
    return Array.isArray(parsed)
      ? parsed.filter((token): token is string => typeof token === 'string')
      : []
  } catch {
    return []
  }
}

export function bossEntranceToken(encounter: Pick<{ id: string; createdAt: string }, 'id' | 'createdAt'>): string {
  return `${encounter.id}:${encounter.createdAt}:active`
}

export function isBossEntrancePending(
  encounter: Pick<{ id: string; createdAt: string; status: string }, 'id' | 'createdAt' | 'status'>,
  storage?: MarkerStorage | null,
): boolean {
  return encounter.status === 'active' && !hasSeenBossEntrance(bossEntranceToken(encounter), storage)
}

export function hasSeenBossEntrance(
  token: string,
  storage: MarkerStorage | null = defaultStorage(),
): boolean {
  return readTokens(storage).includes(token)
}

export function markBossEntranceSeen(
  token: string,
  storage: MarkerStorage | null = defaultStorage(),
): void {
  try {
    const tokens = readTokens(storage)
    if (tokens.includes(token)) return
    storage?.setItem(SEEN_KEY, JSON.stringify([...tokens, token].slice(-MAX_TOKENS)))
  } catch {
    // La presentación es opcional; un fallo de almacenamiento no afecta al juego.
  }
}
