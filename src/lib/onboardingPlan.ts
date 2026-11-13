import { ruleFromDraft } from './recurrenceDraft'
import { todayKey } from './date'
import type { Difficulty, ItemCommitment, ItemType, TrackingType } from '../types'

export const ONBOARDING_GOALS = [
  { id: 'movement', label: 'Moverme y cuidar mi forma física', icon: '🚶' },
  { id: 'learning', label: 'Aprender o desarrollarme profesionalmente', icon: '📚' },
  { id: 'wellbeing', label: 'Dedicar tiempo a mi bienestar', icon: '🌿' },
  { id: 'home', label: 'Organizar mi hogar', icon: '🏠' },
  { id: 'creativity', label: 'Avanzar en proyectos creativos', icon: '🎨' },
  { id: 'relationships', label: 'Cuidar mis relaciones', icon: '💬' },
] as const

export type OnboardingGoal = (typeof ONBOARDING_GOALS)[number]['id']

export const ONBOARDING_WEEKDAYS = [
  { value: 0, label: 'L', name: 'lunes' },
  { value: 1, label: 'M', name: 'martes' },
  { value: 2, label: 'X', name: 'miércoles' },
  { value: 3, label: 'J', name: 'jueves' },
  { value: 4, label: 'V', name: 'viernes' },
  { value: 5, label: 'S', name: 'sábado' },
  { value: 6, label: 'D', name: 'domingo' },
] as const

export interface OnboardingActivity {
  id: string
  goal?: OnboardingGoal
  title: string
  difficulty: Difficulty
  trackingType: TrackingType
  quantityGoal?: number
  unit?: string
  weekdays: number[]
  custom: boolean
}

interface ActivityTemplate {
  title: string
  trackingType: TrackingType
  quantityGoal?: number
  unit?: string
}

const TEMPLATES: Record<OnboardingGoal, ActivityTemplate> = {
  movement: { title: 'Dar un paseo', trackingType: 'quantity', quantityGoal: 10, unit: 'min' },
  learning: { title: 'Aprender algo de mi interés', trackingType: 'quantity', quantityGoal: 15, unit: 'min' },
  wellbeing: { title: 'Dedicar un momento a descansar', trackingType: 'boolean' },
  home: { title: 'Ordenar una zona pequeña', trackingType: 'boolean' },
  creativity: { title: 'Avanzar en un proyecto creativo', trackingType: 'quantity', quantityGoal: 10, unit: 'min' },
  relationships: { title: 'Contactar con alguien importante para mí', trackingType: 'boolean' },
}

function normalizeWeekdays(weekdays: number[]): number[] {
  return [...new Set(weekdays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
    .sort((left, right) => left - right)
}

export function recommendActivities(
  goals: OnboardingGoal[],
  availableWeekdays: number[],
): OnboardingActivity[] {
  const weekdays = normalizeWeekdays(availableWeekdays)
  if (weekdays.length === 0) return []

  return [...new Set(goals)]
    .filter((goal): goal is OnboardingGoal => goal in TEMPLATES)
    .slice(0, 3)
    .map((goal, index) => ({
      id: `suggested-${goal}`,
      goal,
      ...TEMPLATES[goal],
      difficulty: 'easy',
      weekdays: [weekdays[index % weekdays.length]],
      custom: false,
    }))
}

export function createSideQuestInput(activity: OnboardingActivity) {
  const startDate = todayKey()
  return {
    type: 'habit' as ItemType,
    commitment: 'sideQuest' as ItemCommitment,
    title: activity.title.trim(),
    difficulty: activity.difficulty,
    trackingType: activity.trackingType,
    quantityGoal: activity.trackingType === 'quantity' ? activity.quantityGoal : undefined,
    unit: activity.trackingType === 'quantity' ? activity.unit?.trim() || undefined : undefined,
    recurrenceRule: ruleFromDraft({
      unit: 'week',
      interval: 1,
      weekdays: normalizeWeekdays(activity.weekdays),
      monthDay: 1,
      lastDay: false,
      startDate,
      windowDays: 1,
    }),
    startDate,
  }
}
