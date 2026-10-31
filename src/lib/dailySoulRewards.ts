import { parseISO } from 'date-fns'
import type {
  Completion,
  DaySnapshot,
  Item,
  PlayerProfile,
  SoulPassiveActivation,
} from '../types'
import { activityDateKey } from './date'
import {
  createSoulPassiveActivation,
  type SoulPassiveActivationInput,
} from './soulPassiveLedger'
import { isCompletedOn, isObligation, isWindowClosingOn, isWindowCompleted } from './recurrence'

/**
 * Kept on the completion that receives each reward so correction replays can remove the exact
 * previous award before deciding whether (and where) it should be awarded again.
 */
export type DailySoulBonusCompletion = Completion & {
  dailySoulBonusXp?: number
  dailySoulBonusCoins?: number
}

export interface DailySoulRewardResult {
  completions: Completion[]
  activations: SoulPassiveActivation[]
  xpBonus: number
  coinsBonus: number
}

function stripDailyBonus(completion: Completion): DailySoulBonusCompletion {
  const daily = completion as DailySoulBonusCompletion
  const base = { ...completion } as DailySoulBonusCompletion
  delete base.dailySoulBonusXp
  delete base.dailySoulBonusCoins
  base.xpEarned -= daily.dailySoulBonusXp ?? 0
  base.coinsEarned -= daily.dailySoulBonusCoins ?? 0
  return base
}

function isValidCompletion(
  item: Item | undefined,
  completion: Completion,
  date: string,
  runStartedAt?: string,
): item is Item {
  return Boolean(item
    && completion.date === date
    && (!runStartedAt || new Date(completion.createdAt) >= new Date(runStartedAt))
    && activityDateKey(item.createdAt) <= date
    && (!item.startDate || item.startDate <= date)
    && isCompletedOn(item, [completion], date))
}

function latestCompletion(completions: Completion[]): Completion | undefined {
  return [...completions].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id),
  )[0]
}

function activationFor(
  profile: PlayerProfile,
  soulId: 'giant-bat' | 'slogra-gaibon',
  date: string,
  sourceId: string,
  snapshot?: DaySnapshot,
): SoulPassiveActivation | null {
  if (!profile.runStartedAt) return null
  if (snapshot?.date === date && snapshot.runStartedAt !== profile.runStartedAt) return null
  const input: SoulPassiveActivationInput = {
    profile,
    soulId,
    date,
    runStartedAt: profile.runStartedAt,
    sourceId,
    snapshot,
  }
  return createSoulPassiveActivation(input)
}

/**
 * Reassigns the two daily rewards from their underlying completion values. It only uses the
 * date's locked loadout (the matching snapshot for corrections) and returns stable ledger rows
 * keyed to the completion that currently earns each reward.
 */
export function reconcileDailySoulRewards(
  profile: PlayerProfile,
  items: Item[],
  completions: Completion[],
  date: string,
  snapshot?: DaySnapshot,
): DailySoulRewardResult {
  const byId = new Map(items.map((item) => [item.id, item]))
  const baseCompletions = completions.map((completion) =>
    completion.date === date ? stripDailyBonus(completion) : completion,
  )
  const completedItems = new Set<string>()
  const dateCompletions = baseCompletions.filter((completion) => {
    if (completedItems.has(completion.itemId)
      || !isValidCompletion(byId.get(completion.itemId), completion, date, profile.runStartedAt)) return false
    completedItems.add(completion.itemId)
    return true
  })
  const history: Record<string, Completion[]> = {}
  for (const completion of baseCompletions) {
    (history[completion.itemId] ??= []).push(completion)
  }

  const closingObligations = items.filter((item) =>
    !item.archived
    && isObligation(item)
    && isWindowClosingOn(item, parseISO(date)),
  )
  const allObligationsComplete = closingObligations.length > 0
    && closingObligations.every((item) =>
      isWindowCompleted(item, history[item.id] ?? [], date),
    )

  const result = [...baseCompletions]
  const activations: SoulPassiveActivation[] = []
  let xpBonus = 0
  let coinsBonus = 0

  const batSource = allObligationsComplete ? latestCompletion(dateCompletions) : undefined
  const batActivation = batSource
    ? activationFor(profile, 'giant-bat', date, batSource.id, snapshot)
    : null
  if (batSource && batActivation) {
    const percent = batActivation.rank * 0.05
    const baseXp = dateCompletions.reduce((total, completion) => total + completion.xpEarned, 0)
    xpBonus = Math.round(baseXp * percent)
    if (xpBonus > 0) {
      const target = result.find((completion) => completion.id === batSource.id) as DailySoulBonusCompletion
      target.xpEarned += xpBonus
      target.dailySoulBonusXp = xpBonus
      activations.push(batActivation)
    }
  }

  const orderedCompletions = [...dateCompletions].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt) || left.itemId.localeCompare(right.itemId),
  )
  const fifthCompletion = orderedCompletions.length >= 5 ? orderedCompletions[4] : undefined
  const slograActivation = fifthCompletion
    ? activationFor(profile, 'slogra-gaibon', date, fifthCompletion.id, snapshot)
    : null
  if (fifthCompletion && slograActivation) {
    coinsBonus = slograActivation.rank * 5
    const target = result.find((completion) => completion.id === fifthCompletion.id) as DailySoulBonusCompletion
    target.coinsEarned += coinsBonus
    target.dailySoulBonusCoins = coinsBonus
    activations.push(slograActivation)
  }

  return { completions: result, activations, xpBonus, coinsBonus }
}

export function dailySoulBonusTotals(completions: Completion[], date: string): {
  xp: number
  coins: number
} {
  return completions.reduce((totals, completion) => {
    if (completion.date !== date) return totals
    const daily = completion as DailySoulBonusCompletion
    totals.xp += daily.dailySoulBonusXp ?? 0
    totals.coins += daily.dailySoulBonusCoins ?? 0
    return totals
  }, { xp: 0, coins: 0 })
}
