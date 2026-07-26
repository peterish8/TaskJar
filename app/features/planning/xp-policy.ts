import type { Difficulty, Priority } from "../../types"

export function calculateTaskXP(input: { estimatedMinutes?: number; difficulty: Difficulty; priority: Priority }): number {
  const minutes = Math.max(5, Math.min(480, input.estimatedMinutes || 30))
  const durationBase = minutes <= 15 ? 5 : minutes <= 30 ? 8 : minutes <= 60 ? 12 : minutes <= 120 ? 18 : 24
  const difficultyMultiplier = { light: 1, standard: 1.25, challenging: 1.5 }[input.difficulty]
  const urgencyBonus = input.priority === "urgent" ? 2 : 0
  return Math.max(5, Math.min(40, Math.round(durationBase * difficultyMultiplier + urgencyBonus)))
}
