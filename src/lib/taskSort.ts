import { logicalNow } from './date'
import { closingKeyOf } from './recurrence'
import type { Difficulty, Item } from '../types'

export type TaskSortKey = 'difficulty' | 'dueDate' | 'zone'

export const TASK_SORT_LABEL: Record<TaskSortKey, string> = {
  difficulty: 'Dificultad',
  dueDate: 'Vencimiento',
  zone: 'Estancia',
}

const DIFFICULTY_RANK: Record<Difficulty, number> = { trivial: 0, easy: 1, medium: 2, hard: 3 }

function dueDateOf(item: Item, today: Date): string {
  // Sin fecha límite van después de las que sí tienen.
  return closingKeyOf(item, today) ?? '9999-12-31'
}

function compare(a: Item, b: Item, key: TaskSortKey, today: Date): number {
  switch (key) {
    case 'difficulty':
      return DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]
    case 'dueDate':
      return dueDateOf(a, today).localeCompare(dueDateOf(b, today))
    case 'zone':
      // Las tareas sin estancia van al final.
      return (a.zone ?? '\uffff').localeCompare(b.zone ?? '\uffff', 'es')
  }
}

/** Ordena sin mutar; el desempate es siempre dificultad (la más baja primero) y luego nombre. */
export function sortTasks(items: Item[], key: TaskSortKey, today: Date = logicalNow()): Item[] {
  return [...items].sort(
    (a, b) =>
      compare(a, b, key, today) ||
      DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] ||
      a.title.localeCompare(b.title, 'es'),
  )
}
