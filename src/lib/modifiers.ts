import type { ActiveCurse, BossEncounter, CurseId, RelicId } from '../types'
import { activeCursesOn, CURSES } from './curses'
import { hasRelic } from './relics'
import { effectPercent, effectPercentForItem } from './bosses'

/** Lo que altera las reglas normales en un día: el boss activo y las maldiciones en curso. */
export interface ModifierContext {
  boss?: BossEncounter | null
  curses?: ActiveCurse[]
  zone?: string
  relics?: RelicId[]
}

function cursePercent(
  ctx: ModifierContext,
  dateKey: string,
  pick: (definition: (typeof CURSES)[keyof typeof CURSES]) => number | undefined,
): number {
  return activeCursesOn(ctx.curses, dateKey).reduce((percent, curse) => {
    const value = pick(CURSES[curse.id])
    return value === undefined ? percent : (percent * value) / 100
  }, 100)
}

/** EXP final: bonos normales, luego el efecto del boss y las maldiciones, redondeando hacia arriba. */
export function modifyXp(xp: number, ctx: ModifierContext, dateKey: string): number {
  const percent = (effectPercentForItem(ctx.boss, 'xpPercent', dateKey, ctx.zone)
    * cursePercent(ctx, dateKey, (c) => c.xpPercent)) / 100
  return percent === 100 ? xp : Math.ceil((xp * percent) / 100)
}

export function modifyCoins(coins: number, ctx: ModifierContext, dateKey: string): number {
  const percent = cursePercent(ctx, dateKey, (c) => c.coinPercent)
  return percent === 100 ? coins : Math.max(coins > 0 ? 1 : 0, Math.ceil((coins * percent) / 100))
}

/** Vida que cura una poción con los efectos del día; 0 si una maldición lo impide. */
export function potionRecovery(base: number, ctx: ModifierContext, dateKey: string): number {
  const percent = (effectPercent(ctx.boss, 'potionPercent', dateKey) * cursePercent(ctx, dateKey, (c) => c.potionPercent)) / 100
  return Math.floor((base * percent) / 100)
}

/** Daño de una penalización, incluyendo efectos globales y de zona del boss. */
export function modifyDamage(damage: number, ctx: ModifierContext, dateKey: string): number {
  const percent = effectPercentForItem(ctx.boss, 'damagePercent', dateKey, ctx.zone)
  const cursePercentValue = cursePercent(ctx, dateKey, (c) => c.damagePercent)
  const totalPercent = (percent * cursePercentValue) / 100
  return totalPercent === 100 ? damage : Math.ceil((damage * totalPercent) / 100)
}

export function canPostpone(ctx: ModifierContext, dateKey: string): boolean {
  return !activeCursesOn(ctx.curses, dateKey).some((curse) => CURSES[curse.id].blocksPostpone)
}

export function freezesEnabled(ctx: ModifierContext, dateKey: string): boolean {
  return !activeCursesOn(ctx.curses, dateKey).some((curse) => curse.id === 'petrification')
}

export function streaksEnabled(ctx: ModifierContext, dateKey: string): boolean {
  return freezesEnabled(ctx, dateKey)
}

export function historicalStatsVisible(curses: ActiveCurse[] | undefined, relics?: RelicId[]): boolean {
  return hasRelic(relics, 'silverMirror') && !curses?.some((curse) => curse.id === 'amnesia')
}

export function curseDamageMultiplier(ctx: ModifierContext, dateKey: string): number {
  return cursePercent(ctx, dateKey, (c) => c.damagePercent) / 100
}

export function isGraveCurse(id: CurseId): boolean {
  return CURSES[id].severity === 'grave'
}
