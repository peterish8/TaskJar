export type Priority = "urgent" | "scheduled" | "optional"
export type Difficulty = "light" | "standard" | "challenging"
export type TaskSource = "manual" | "daily-ai" | "weekly-ai" | "voice-ai"
export type LocalModelId = "gemma-270m" | "gemma-1b"
export type EnergyLevel = "low" | "medium" | "high"
export type Daypart = "morning" | "afternoon" | "evening" | "night" | "anytime"
export type ConstraintSource = "explicit" | "inferred" | "none"

export interface Subtask {
  id: string
  title: string
  completed: boolean
  estimatedMinutes?: number
  completedAt?: number
}

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
  scheduledFor?: string
  source?: TaskSource
  originalPrompt?: string
  estimatedMinutes?: number
  energy?: EnergyLevel
  suggestedStartTime?: string
  preferredDaypart?: Daypart
  timingConstraintSource?: ConstraintSource
  timingReason?: string
  sourceTranscript?: string
  aiGenerated?: boolean
  planningConfidence?: number
  subtasks?: Subtask[]
  actualMinutes?: number
  warnings?: string[]
  xpAwarded?: boolean
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
  schemaVersion: 2
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
  parentLock: {
    enabled: boolean
    password: string
    securityQuestion: string
    securityAnswer: string
  }
  preferences: {
    soundEnabled: boolean
    timezone: string
    theme: "dark"
    wakeTime: string
    sleepTime: string
    preferredFocusPeriod: "morning" | "afternoon" | "evening"
    maxPlannedMinutesPerDay: number
  }
  localAI: {
    selectedModelId: LocalModelId
  }
  voice: {
    modelId: "whisper-tiny.en"
    languageTag: "en"
    hasAcknowledgedDisclosure: boolean
  }
}

export interface GeneratedTask {
  clientId?: string
  name: string
  description: string
  priority: Priority
  difficulty: Difficulty
  scheduledFor?: string
  selected?: boolean
  estimatedMinutes?: number
  energy?: EnergyLevel
  suggestedStartTime?: string
  preferredDaypart?: Daypart
  timingConstraintSource?: ConstraintSource
  timingReason?: string
  planningConfidence?: number
  subtasks?: Subtask[]
  sourceExcerpt?: string
  warnings?: string[]
}

export interface PlanResult {
  tasks: GeneratedTask[]
  totalEstimatedMinutes: number
  planningWarnings: string[]
  unparsedNotes: string[]
}
