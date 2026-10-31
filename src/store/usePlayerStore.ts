import { create } from 'zustand'
import { db, ensurePlayerProfile } from '../db/database'
import { activeEncounter } from '../lib/bosses'
import { cureCost, removeCurse } from '../lib/curses'
import { todayKey } from '../lib/date'
import { SYSTEM_RESOURCES } from '../lib/resources'
import { canPurchaseAncientAmulet } from '../lib/relics'
import { potionRecovery } from '../lib/modifiers'
import { HP_PER_LEVEL, levelUpRecovery, xpToNextLevel } from '../lib/gamification'
import { defaultRoutes, effectiveMaxHp, evaluateRoute, ROUTE_IDS, ROUTES } from '../lib/routes'
import { dailyPotionMultiplier, equippedSoulRank, soulSlotsForLevel } from '../lib/souls'
import { createSoulPassiveActivation } from '../lib/soulPassiveLedger'
import { eclipseMultiplierForDay } from '../lib/weather'
import type { Completion, CurseId, Item, LevelUpInfo, PlayerProfile, RouteId, SoulId } from '../types'

interface PlayerState {
  profile: PlayerProfile | null
  loading: boolean
  /** Subida de nivel reciente pendiente de celebrar en la UI (null = nada pendiente). */
  justLeveledUp: LevelUpInfo | null
  clearLevelUp: () => void
  load: () => Promise<void>
  awardCompletion: (xp: number, coins: number) => Promise<void>
  revertCompletion: (xp: number, coins: number) => Promise<void>
  applyDamage: (amount: number) => Promise<void>
  buyPostponeTokens: (quantity: number, cost: number) => Promise<boolean>
  spendPostponeToken: () => Promise<boolean>
  buyVitalityPotion: (cost: number) => Promise<boolean>
  consumeVitalityPotion: () => Promise<boolean>
  /** Cura una maldición con agua bendita o pagando a la sacerdotisa. */
  cureCurse: (id: CurseId, method: 'holyWater' | 'priest') => Promise<boolean>
  buyStreakFreeze: (cost: number) => Promise<boolean>
  buyAncientAmulet: () => Promise<boolean>
  setStreakFreezes: (quantity: number) => Promise<void>
  startRoute: (routeId: RouteId) => Promise<boolean>
  evaluateRoutes: (items: Item[], completionsByItem: Record<string, Completion[]>) => Promise<void>
  equipRoute: (routeId: RouteId | null) => Promise<boolean>
  setShieldReadyOn: (date: string | undefined) => Promise<void>
  restartRun: () => Promise<void>
  ensureDailySoulLoadout: () => Promise<void>
  setDailySoulLoadout: (ids: SoulId[]) => Promise<boolean>
  equipSoul: (id: SoulId) => Promise<boolean>
  setLastPenaltyCheck: (date: string) => Promise<void>
  spendCoins: (amount: number) => Promise<boolean>
}

/** Celebración de una subida de nivel; si ya había una pendiente, se amplía desde su nivel inicial. */
export function mergeLevelUp(
  pending: LevelUpInfo | null,
  before: PlayerProfile,
  after: PlayerProfile,
): LevelUpInfo {
  const from = pending?.from ?? before.level
  return {
    from,
    to: after.level,
    maxHpGain: (after.level - from) * HP_PER_LEVEL,
    maxHp: effectiveMaxHp(after),
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  profile: null,
  loading: true,
  justLeveledUp: null,

  clearLevelUp: () => set({ justLeveledUp: null }),

  load: async () => {
    const profile = await ensurePlayerProfile()
    const normalized = {
      ...profile,
      hardcore: true,
      dead: Boolean(profile.dead),
      postponeTokens: profile.postponeTokens ?? 0,
      vitalityPotions: profile.vitalityPotions ?? 0,
      streakFreezes: profile.streakFreezes ?? 0,
      holyWater: profile.holyWater ?? 0,
      curses: profile.curses ?? [],
      penanceProgress: profile.penanceProgress ?? {},
      routes: { ...defaultRoutes(), ...profile.routes },
      equippedRoute: profile.equippedRoute ?? null,
      souls: profile.souls ?? {},
      soulPity: profile.soulPity ?? {},
      relics: profile.relics ?? [],
      legionVictories: Math.max(
        0,
        profile.legionVictories ?? (profile.relics?.includes('heart') ? 1 : 0),
      ),
      equippedSouls: profile.equippedSouls ?? [],
    }
    if (
      normalized.hardcore !== profile.hardcore ||
      normalized.dead !== profile.dead ||
      normalized.postponeTokens !== profile.postponeTokens
      || normalized.vitalityPotions !== profile.vitalityPotions
      || normalized.streakFreezes !== profile.streakFreezes
      || profile.holyWater === undefined
      || profile.curses === undefined
      || profile.routes === undefined
      || profile.equippedRoute === undefined
      || profile.souls === undefined
      || profile.soulPity === undefined
      || profile.relics === undefined
      || profile.legionVictories === undefined
      || profile.equippedSouls === undefined
      || profile.penanceProgress === undefined
    ) {
      await db.profile.put(normalized)
    }
    set({ profile: normalized, loading: false })
  },

  awardCompletion: async (xp, coins) => {
    const current = get().profile
    if (!current || current.dead) return

    let { level, xp: currentXp, maxHp } = current
    currentXp += xp
    let leveledUp = false
    while (currentXp >= xpToNextLevel(level)) {
      currentXp -= xpToNextLevel(level)
      level += 1
      maxHp += HP_PER_LEVEL
      leveledUp = true
    }
    const nextMaxHp = effectiveMaxHp({ ...current, maxHp })

    const updated: PlayerProfile = {
      ...current,
      level,
      xp: currentXp,
      maxHp,
      hp: leveledUp
        ? Math.min(nextMaxHp, current.hp + levelUpRecovery(nextMaxHp))
        : current.hp,
      coins: current.coins + coins,
    }
    await db.profile.put(updated)
    set({
      profile: updated,
      justLeveledUp: leveledUp ? mergeLevelUp(get().justLeveledUp, current, updated) : get().justLeveledUp,
    })
  },

  // Simplificado: no revierte subidas de nivel, solo resta XP/monedas dentro del nivel actual.
  revertCompletion: async (xp, coins) => {
    const current = get().profile
    if (!current || current.dead) return

    const updated: PlayerProfile = {
      ...current,
      xp: Math.max(0, current.xp - xp),
      coins: Math.max(0, current.coins - coins),
    }
    await db.profile.put(updated)
    set({ profile: updated })
  },

  applyDamage: async (amount) => {
    const current = get().profile
    if (!current || current.dead || amount <= 0) return

    const nextHp = Math.max(0, current.hp - Math.ceil(amount * eclipseMultiplierForDay(todayKey())))
    const died = nextHp === 0

    const updated: PlayerProfile = {
      ...current,
      hp: nextHp,
      dead: died,
    }
    await db.profile.put(updated)
    set({ profile: updated })
  },

  buyPostponeTokens: async (quantity, cost) => {
    const current = get().profile
    if (!current || current.dead || quantity <= 0 || cost <= 0 || current.coins < cost) return false

    const updated: PlayerProfile = {
      ...current,
      coins: current.coins - cost,
      postponeTokens: current.postponeTokens + quantity,
    }
    await db.profile.put(updated)
    set({ profile: updated })
    return true
  },

  spendPostponeToken: async () => {
    const current = get().profile
    if (!current || current.dead || current.postponeTokens <= 0) return false

    const updated: PlayerProfile = {
      ...current,
      postponeTokens: current.postponeTokens - 1,
    }
    await db.profile.put(updated)
    set({ profile: updated })
    return true
  },

  buyVitalityPotion: async (cost) => {
    const current = get().profile
    if (!current || current.dead || cost <= 0 || current.coins < cost) return false

    const updated: PlayerProfile = {
      ...current,
      coins: current.coins - cost,
      vitalityPotions: current.vitalityPotions + 1,
    }
    await db.profile.put(updated)
    set({ profile: updated })
    return true
  },

  consumeVitalityPotion: async () => {
    const date = todayKey()
    let updated: PlayerProfile | null = null
    await db.transaction(
      'rw',
      [db.profile, db.bossEncounters, db.soulPassiveActivations],
      async () => {
        const [current, encounters] = await Promise.all([
          db.profile.get(1),
          db.bossEncounters.toArray(),
        ])
        const maxHp = current ? effectiveMaxHp(current) : 0
        if (!current || current.dead || current.vitalityPotions <= 0 || current.hp >= maxHp) return

        const boss = activeEncounter(encounters)
        const recovery = potionRecovery(
          SYSTEM_RESOURCES.vitalityPotion.recovery, { boss, curses: current.curses }, date,
        )
        // Una maldición que anula la curación no gasta la poción ni consume la pasiva.
        if (recovery <= 0) return

        const rank = equippedSoulRank(current, 'succubus', date)
        const priorUses = rank > 0 && current.runStartedAt
          ? await db.soulPassiveActivations
            .where('[runStartedAt+passiveId+date]')
            .equals([current.runStartedAt, 'dailyPotion', date])
            .toArray()
          : []
        const usePassive = rank > 0 && current.runStartedAt && priorUses.length === 0
        const finalRecovery = Math.floor(recovery * (usePassive ? dailyPotionMultiplier(rank) : 1))
        const next: PlayerProfile = {
          ...current,
          hp: Math.min(maxHp, current.hp + finalRecovery),
          vitalityPotions: current.vitalityPotions - 1,
        }
        await db.profile.put(next)

        if (usePassive && current.runStartedAt) {
          const activation = createSoulPassiveActivation({
            profile: current,
            soulId: 'succubus',
            date,
            runStartedAt: current.runStartedAt,
            sourceId: `potion:${date}`,
          })
          if (!activation) throw new Error('No se pudo registrar la pasiva de Succubus.')
          await db.soulPassiveActivations.add(activation)
        }
        updated = next
      },
    )
    if (!updated) return false
    set({ profile: updated })
    return true
  },

  cureCurse: async (id, method) => {
    const current = get().profile
    if (!current || current.dead || !current.curses?.some((curse) => curse.id === id)) return false
    if (method === 'holyWater' && (current.holyWater ?? 0) <= 0) return false
    const cost = cureCost(current.level)
    if (method === 'priest' && current.coins < cost) return false

    const updated: PlayerProfile = {
      ...current,
      curses: removeCurse(current.curses, id),
      penanceProgress: { ...(current.penanceProgress ?? {}), [id]: 0 },
      holyWater: method === 'holyWater' ? (current.holyWater ?? 0) - 1 : current.holyWater,
      coins: method === 'priest' ? current.coins - cost : current.coins,
    }
    await db.profile.put(updated)
    set({ profile: updated })
    return true
  },

  buyStreakFreeze: async (cost) => {
    const current = get().profile
    if (!current || current.dead || cost <= 0 || current.coins < cost) return false

    const updated: PlayerProfile = {
      ...current,
      coins: current.coins - cost,
      streakFreezes: current.streakFreezes + 1,
    }
    await db.profile.put(updated)
    set({ profile: updated })
    return true
  },

  buyAncientAmulet: async () => {
    const today = todayKey()
    const cost = SYSTEM_RESOURCES.ancientAmulet.cost
    const updated = await db.transaction('rw', db.profile, async () => {
      const current = await db.profile.get(1)
      if (!current || !canPurchaseAncientAmulet(current, today, cost)) return null

      const next: PlayerProfile = {
        ...current,
        coins: current.coins - cost,
        relics: [...(current.relics ?? []), 'ancientAmulet'],
      }
      await db.profile.put(next)
      return next
    })
    if (!updated) return false
    set({ profile: updated })
    return true
  },

  setStreakFreezes: async (quantity) => {
    const current = get().profile
    if (!current) return

    const updated: PlayerProfile = { ...current, streakFreezes: Math.max(0, quantity) }
    await db.profile.put(updated)
    set({ profile: updated })
  },

  startRoute: async (routeId) => {
    const current = get().profile
    if (!current || current.dead || current.routes[routeId].windowStart) return false

    const updated: PlayerProfile = {
      ...current,
      routes: {
        ...current.routes,
        [routeId]: { level: 0, windowStart: todayKey(), startedOn: todayKey(), startedAt: new Date().toISOString() },
      },
    }
    await db.profile.put(updated)
    set({ profile: updated })
    return true
  },

  evaluateRoutes: async (items, completionsByItem) => {
    const current = get().profile
    if (!current || current.dead) return

    const today = todayKey()
    const routes = { ...current.routes }
    let changed = false
    for (const id of ROUTE_IDS) {
      const next = evaluateRoute(ROUTES[id], routes[id], items, completionsByItem, today)
      if (next !== routes[id]) {
        routes[id] = next
        changed = true
      }
    }
    if (!changed) return

    const updated: PlayerProfile = { ...current, routes }
    await db.profile.put(updated)
    set({ profile: updated })
  },

  equipRoute: async (routeId) => {
    const current = get().profile
    if (!current || current.dead) return false
    if (routeId && current.routes[routeId].level < 1) return false

    const equipped: PlayerProfile = { ...current, equippedRoute: routeId }
    const updated: PlayerProfile = { ...equipped, hp: Math.min(current.hp, effectiveMaxHp(equipped)) }
    await db.profile.put(updated)
    set({ profile: updated })
    return true
  },

  setShieldReadyOn: async (date) => {
    const current = get().profile
    if (!current || current.shieldReadyOn === date) return

    const updated: PlayerProfile = { ...current, shieldReadyOn: date }
    await db.profile.put(updated)
    set({ profile: updated })
  },

  restartRun: async () => {
    const current = get().profile
    if (!current) return

    const updated: PlayerProfile = {
      ...current,
      level: 1,
      xp: 0,
      coins: 0,
      postponeTokens: 0,
      vitalityPotions: 0,
      hp: 20,
      maxHp: 20,
      streakFreezes: 0,
      holyWater: 0,
      curses: [],
      penanceProgress: {},
      routes: defaultRoutes(),
      equippedRoute: null,
      relics: [],
      legionVictories: 0,
      equippedSouls: [],
      dailySoulLoadout: undefined,
      shieldReadyOn: undefined,
      dead: false,
      lastPenaltyCheck: todayKey(),
      runStartedAt: new Date().toISOString(),
      penaltyCheckpoint: undefined,
    }
    await db.transaction('rw', [db.items, db.profile, db.bossEncounters], async () => {
      const routeItems = (await db.items.toArray()).filter(
        (item) => item.routeId && !item.archived,
      )
      if (routeItems.length > 0) {
        await db.items.bulkPut(routeItems.map((item) => ({ ...item, archived: true })))
      }
      // El boss pendiente o activo de la expedición anterior no debe herir ni frenar a la nueva;
      // los resueltos se conservan porque forman el bestiario.
      await db.bossEncounters.where('status').anyOf('scheduled', 'cooldown', 'active').delete()
      await db.profile.put(updated)
    })
    set({ profile: updated, justLeveledUp: null })
  },

  equipSoul: async () => {
    // El loadout se elige una vez al entrar en el día; no se puede mutar desde
    // las acciones individuales del panel de perfil.
    return false
  },

  ensureDailySoulLoadout: async () => {
    const current = get().profile
    const date = todayKey()
    if (!current || current.dailySoulLoadout?.date === date) return
    if (Object.keys(current.souls ?? {}).length > 0 && soulSlotsForLevel(current.level) > 0) return

    const updated: PlayerProfile = {
      ...current,
      equippedSouls: [],
      dailySoulLoadout: { date, souls: [] },
    }
    await db.profile.put(updated)
    set({ profile: updated })
  },

  setDailySoulLoadout: async (ids) => {
    const current = get().profile
    const date = todayKey()
    if (!current || current.dailySoulLoadout?.date === date) return false

    const unique = [...new Set(ids)]
    const valid = unique.every((id) => Boolean(current.souls?.[id]))
    if (!valid || unique.length > soulSlotsForLevel(current.level)) return false

    const updated: PlayerProfile = {
      ...current,
      equippedSouls: unique,
      dailySoulLoadout: { date, souls: unique },
    }
    await db.profile.put(updated)
    set({ profile: updated })
    return true
  },

  setLastPenaltyCheck: async (date) => {
    const current = get().profile
    if (!current) return

    const updated: PlayerProfile = { ...current, lastPenaltyCheck: date }
    await db.profile.put(updated)
    set({ profile: updated })
  },

  spendCoins: async (amount) => {
    const current = get().profile
    if (!current || current.dead || current.coins < amount) return false

    const updated: PlayerProfile = { ...current, coins: current.coins - amount }
    await db.profile.put(updated)
    set({ profile: updated })
    return true
  },
}))
