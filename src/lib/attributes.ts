import { computeStreak } from './streak'
import type { Completion, Item } from '../types'

export interface Attributes {
  str: number
  con: number
  int: number
  lck: number
}

/** Atributos derivados del historial: STR por tareas duras, CON por racha, INT por rituales, LCK por reliquias. */
export function computeAttributes(
  items: Item[],
  completionsByItem: Record<string, Completion[]>,
  relicsUnlocked: number,
): Attributes {
  let toughDone = 0
  let bestStreak = 0

  for (const item of items) {
    const list = completionsByItem[item.id] ?? []
    if (item.difficulty === 'medium' || item.difficulty === 'hard') {
      toughDone += list.filter((c) => c.xpEarned > 0).length
    }
    if (item.type !== 'todo' && !item.archived) {
      bestStreak = Math.max(bestStreak, computeStreak(item, list))
    }
  }

  const activeHabits = items.filter((i) => i.type === 'habit' && !i.archived).length

  return {
    str: 5 + toughDone,
    con: 5 + bestStreak,
    int: 5 + activeHabits * 2,
    lck: 5 + relicsUnlocked * 3,
  }
}
