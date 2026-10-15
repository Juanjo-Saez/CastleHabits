export type ItemType = 'habit' | 'chore' | 'todo'

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard'

export type TrackingType = 'boolean' | 'quantity'

export type ItemCommitment = 'obligation' | 'sideQuest'

export type RouteId = 'vampire-hunter' | 'technomancer' | 'castle-within'

export interface RouteProgress {
  /** Tramos completados; es el nivel de la pasiva (0 = bloqueada). */
  level: number
  /** Primer día (yyyy-MM-dd) de la ventana del tramo actual; ausente si la ruta no se ha iniciado. */
  windowStart?: string
}

export type ItemEventKind =
  | 'completed'
  | 'missed'
  | 'lateRecovery'
  | 'partialProgress'
  | 'undone'
  | 'postponed'

export interface Item {
  id: string
  type: ItemType
  /** Las misiones secundarias recompensan, pero nunca causan daño por incumplimiento. */
  commitment?: ItemCommitment
  title: string
  icon?: string
  /** Solo para chores: estancia del castillo (ej. "Alchemy Laboratory"). */
  zone?: string
  difficulty: Difficulty
  /** Regla RRULE en texto. null/undefined para todos puntuales. */
  recurrenceRule?: string | null
  /**
   * Primer día (yyyy-MM-dd) en que la tarea aparece; antes no cuenta como debida.
   * En pergaminos, marca el inicio del margen hasta `dueDate`; ausente = visible desde su creación.
   */
  startDate?: string
  /** Margen en días tras abrirse la aparición para cumplirla; ausente o 1 = solo ese día. */
  windowDays?: number
  /** Ruta a la que cuenta esta tarea. */
  routeId?: RouteId
  trackingType: TrackingType
  /** Meta a alcanzar cuando trackingType es "quantity" (ej. 100 sentadillas). */
  quantityGoal?: number
  unit?: string
  /** Solo para todos puntuales, ISO date. */
  dueDate?: string | null
  /** Aplazamiento activo de la aparición actual, si existe. */
  postponedFrom?: string
  postponedUntil?: string
  archived: boolean
  createdAt: string
}

export interface Completion {
  id: string
  itemId: string
  /** Día en formato yyyy-MM-dd, una entrada por item y día. */
  date: string
  quantityDone?: number
  xpEarned: number
  coinsEarned: number
  createdAt: string
}

export interface ItemEvent {
  id: string
  itemId: string
  itemTitle: string
  itemType: ItemType
  commitment?: ItemCommitment
  kind: ItemEventKind
  /** Fecha de la aparición de la tarea, no necesariamente la fecha del evento. */
  scheduledDate: string
  occurredAt: string
  quantityGoal?: number
  quantityDone?: number
  damage?: number
  /** Fallo absorbido por escudo o congelación: se registra sin daño. */
  protectedBy?: 'shield' | 'freeze'
  xpEarned?: number
  coinsEarned?: number
  postponedUntil?: string
}

export interface PlayerProfile {
  id: number
  level: number
  xp: number
  coins: number
  postponeTokens: number
  vitalityPotions: number
  hp: number
  maxHp: number
  streakFreezes: number
  routes: Record<RouteId, RouteProgress>
  /** Oficio equipado: su pasiva es la única activa. */
  equippedRoute: RouteId | null
  /** Primer día (yyyy-MM-dd) en que el escudo de Castle Within vuelve a estar listo. */
  shieldReadyOn?: string
  /** Modo Hardcore: al llegar a 0 HP la partida termina. */
  hardcore: boolean
  dead: boolean
  /** Último día (yyyy-MM-dd) hasta el que ya se aplicó el daño por tareas vencidas. */
  lastPenaltyCheck?: string
}

export type ReminderUnit = 'day' | 'month'

/** Aviso periódico independiente: no genera tareas, ni daño, ni EXP. */
export interface Reminder {
  id: string
  title: string
  /** Cada cuántos días o meses vuelve a avisar (mínimo 1). */
  every: number
  unit: ReminderUnit
  /** Última vez que se hizo (yyyy-MM-dd); si falta, cuenta desde la creación. */
  lastDoneOn?: string
  /** No avisar hasta este día (yyyy-MM-dd) tras pulsar "Más tarde". */
  snoozedUntil?: string
  archived: boolean
  createdAt: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  unlockedAt?: string | null
}

export interface Reward {
  id: string
  name: string
  cost: number
  createdAt: string
}
