import { addXp } from './gamification'

export interface TutorialPlayerSnapshot {
  level: number
  xp: number
  coins: number
}

export function tutorialCompletionPreview(
  profile: TutorialPlayerSnapshot,
  xpReward: number,
  coinReward: number,
) {
  const progression = addXp(profile.level, profile.xp, xpReward)
  return {
    before: { ...profile },
    after: {
      ...progression,
      coins: profile.coins + coinReward,
    },
    xpReward,
    coinReward,
  }
}
