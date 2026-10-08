import type { Difficulty, Item } from '../types'

export type TaskSortKey = 'difficulty' | 'dueDate' | 'zone'

export const TASK_SORT_LABEL: Record<TaskSortKey, string> = {
  difficulty: 'Dificultad',
  dueDate: 'Vencimiento',
  zone: 'Estancia',
}

const DIFFICULTY_RANK: Record<Difficulty, number> = { hard: 0, medium: 1, easy: 2, trivial: 3 }

function dueDateOf(item: Item): string {
  // Sin fecha límite (recurrentes) van después de las que sí tienen.
  return item.postponedUntil ?? item.dueDate ?? '9999-12-31'
}

function compare(a: Item, b: Item, key: TaskSortKey): number {
  switch (key) {
    case 'difficulty':
      return DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]
    case 'dueDate':
      return dueDateOf(a).localeCompare(dueDateOf(b))
    case 'zone':
      // Las tareas sin estancia van al final.
      return (a.zone ?? '\uffff').localeCompare(b.zone ?? '\uffff', 'es')
  }
}

/** Ordena sin mutar; el desempate es siempre dificultad (la más alta primero) y luego nombre. */
export function sortTasks(items: Item[], key: TaskSortKey): Item[] {
  return [...items].sort(
    (a, b) =>
      compare(a, b, key) ||
      DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] ||
      a.title.localeCompare(b.title, 'es'),
  )
}
