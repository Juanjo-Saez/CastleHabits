export type ItemType = 'habit' | 'chore' | 'todo'

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard'

export type TrackingType = 'boolean' | 'quantity'

export type ItemCommitment = 'obligation' | 'sideQuest'

export type RouteId = 'vampire-hunter' | 'technomancer' | 'castle-within'

export interface RouteProgress {
  /** Inicio de la ruta en esta expedición, para recalcular sus tramos al corregir registros. */
  startedOn?: string
  startedAt?: string
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
  /** Cantidad que añade cada registro normal; por defecto se calcula desde la meta. */
  quantityStep?: number
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
  quantityGoal?: number
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
  /** Día operativo de la actividad; puede diferir del momento de una corrección. */
  activityDate?: string
  runStartedAt?: string
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
  /** Consumible que cura una maldición; lo dan algunos bosses. */
  holyWater: number
  /** Maldiciones activas (máximo 2). Se reinician al empezar otra expedición. */
  curses: ActiveCurse[]
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
  /** Instante inicial de la expedición; ausente en perfiles antiguos pendientes de confirmar. */
  runStartedAt?: string
  /** Datos previos a evaluar ayer, para poder redistribuir sus defensas al corregirlo. */
  penaltyCheckpoint?: PenaltyCheckpoint
}

/**
 * Estado informativo del jugador al cerrar un día (tras aplicar sus penalizaciones).
 * Solo alimenta el resumen diario: nunca concede ni retira efectos de juego.
 */
export interface DaySnapshot {
  /** Día operativo (yyyy-MM-dd) que cierra; es la clave. */
  date: string
  /** Expedición a la que pertenece; un snapshot de otra expedición no se usa. */
  runStartedAt?: string
  level: number
  xp: number
  hp: number
  /** Vida máxima efectiva (con el bono del oficio equipado). */
  maxHp: number
}

/** Subida de nivel pendiente de celebrar: del nivel anterior al actual, con sus mejoras. */
export interface LevelUpInfo {
  from: number
  to: number
  /** Vida máxima ganada con las subidas (la vida se restaura al máximo). */
  maxHpGain: number
  maxHp: number
}

export interface PenaltyCheckpoint {
  date: string
  items: Item[]
  freezes: number
  shieldEnabled: boolean
  shieldReadyOn?: string
  runStartedAt?: string
}

/** Pendiente sin fecha: idea para convertir en tarea más adelante. No se completa ni aplica daño o EXP. */
export interface Reminder {
  id: string
  title: string
  archived: boolean
  createdAt: string
}

export type BossId = 'giant-bat' | 'slogra-gaibon' | 'legion' | 'frankenstein'

/** `scheduled` es la espera inicial; `cooldown`, la espera posterior a un encuentro resuelto. */
export type BossStatus = 'scheduled' | 'active' | 'victory' | 'defeat' | 'cooldown'

/** Consumibles de inventario que pueden soltar los bosses. */
export type BossResource = 'postponeToken' | 'vitalityPotion' | 'streakFreeze' | 'holyWater'

export type CurseId = 'impaledSpear' | 'heaviness' | 'avarice' | 'silence' | 'poison' | 'charm' | 'shadow' | 'stitches'

/** Maldición en curso: rige desde `startedOn` hasta el día anterior a `expiresOn`. */
export interface ActiveCurse {
  id: CurseId
  sourceBoss: BossId
  startedOn: string
  expiresOn: string
  /** Último día (yyyy-MM-dd) cuyo daño diario ya se aplicó. */
  lastTickOn?: string
}

export interface BossRewards {
  xp: number
  coins: number
  items: Partial<Record<BossResource, number>>
}

/** Una aparición de un boss. Solo existe una sin resolver a la vez; el progreso se deriva de los completados. */
export interface BossEncounter {
  /** Estable: una escritura repetida no crea duplicados. Los nuevos son `enc:<sequence>`. */
  id: string
  /** Boss de esta aparición; mientras está pendiente es provisional y un disparador puede cambiarlo. */
  bossId: BossId
  sequence: number
  status: BossStatus
  /** Primer día operativo (yyyy-MM-dd) en que puede activarse. */
  scheduledFor: string
  windowStart?: string
  windowEnd?: string
  /** Meta fijada al activarse según la carga real (p. ej. vida total del boss de golpes). */
  goal?: number
  /** Zonas que forman las piezas de un boss de objetivo `pieces`. */
  zones?: string[]
  resolvedOn?: string
  /** Día en que podrá activarse la siguiente aparición, fijado al resolver. */
  nextActivationOn?: string
  rewardGranted: boolean
  damageApplied: boolean
  rewards?: BossRewards
  /** Maldición aplicada al perder. */
  curse?: CurseId
  /** Solo en registros anteriores a `rewards`; se migra al leerlos. */
  rewardResource?: BossResource
  /** Identifica la aparición para los avisos de la interfaz, aunque se reinicien los datos. */
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
