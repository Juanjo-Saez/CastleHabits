import type { SoulRank } from '../types'

export interface PlayerDamageResolution {
  hp: number
  damageApplied: number
  deathSaved: boolean
}

/** Death prevents a lethal hit up to the active rank's expedition-wide limit. */
export function resolvePlayerDamage(
  hp: number,
  incomingDamage: number,
  deathRank: SoulRank | 0 = 0,
  deathSavesUsed = 0,
): PlayerDamageResolution {
  const damage = Math.ceil(Math.max(0, incomingDamage))
  const deathSaved = damage > 0
    && hp > 0
    && hp - damage <= 0
    && deathRank > deathSavesUsed

  return {
    hp: deathSaved ? 1 : Math.max(0, hp - damage),
    damageApplied: deathSaved ? Math.max(0, hp - 1) : damage,
    deathSaved,
  }
}
