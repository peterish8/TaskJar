export type Priority = "urgent" | "scheduled" | "optional"
export type Difficulty = "light" | "standard" | "challenging"
export type TaskSource = "manual" | "daily-ai" | "weekly-ai"
export type LocalModelId = "gemma-270m" | "gemma-1b"

export interface Task {
  id: string
  name: string
  description: string
  priority: Priority
  difficulty: Difficulty
  priorityEmoji: string
  difficultyEmoji: string
  xpValue: number
  completed: boolean
  completedAt?: number
  createdAt: number
  /** Local date key in yyyy-MM-dd format. */
  scheduledFor?: string
  source?: TaskSource
  originalPrompt?: string
}

export interface Jar {
  id: string
  currentXP: number
  targetXP: number
  completed: boolean
  completedAt?: number
  tasks: string[]
  name?: string
}

export interface AppSettings {
  studentName: string
  xpValues: {
    light: number
    standard: number
    challenging: number
  }
  jarTarget: number
  emojis: {
    priority: Record<Priority, string>
    difficulty: Record<Difficulty, string>
  }
  preferences: {
    soundEnabled: boolean
    theme: "dark"
  }
  localAI: {
    selectedModelId: LocalModelId
  }
}

export interface GeneratedTask {
  name: string
  description: string
  priority: Priority
  difficulty: Difficulty
  scheduledFor?: string
}
