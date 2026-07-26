export type Priority = "urgent" | "scheduled" | "optional"
export type Difficulty = "light" | "standard" | "challenging"
export type EnergyLevel = "low" | "medium" | "high"
export type Daypart = "morning" | "afternoon" | "evening" | "night" | "anytime"
export type ConstraintSource = "explicit" | "inferred" | "none"
export interface Subtask { id: string; title: string; completed: boolean; estimatedMinutes?: number; completedAt?: number }

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
  /** Local-first planning metadata. All fields are optional for legacy tasks. */
  source?: "manual" | "daily-ai" | "weekly-ai" | "voice-ai" | "legacy"
  estimatedMinutes?: number
  energy?: EnergyLevel
  suggestedStartTime?: string
  preferredDaypart?: Daypart
  timingConstraintSource?: ConstraintSource
  timingReason?: string
  subtasks?: Subtask[]
  actualMinutes?: number
  warnings?: string[]
  aiGenerated?: boolean
  planningConfidence?: number
  xpAwarded?: boolean
}

export interface WeeklyTask {
  id: string
  name: string
  description?: string
  priority: "low" | "medium" | "high"
  difficulty: "easy" | "moderate" | "hard"
  scheduledDate: string // ISO date
  completed?: boolean
  completedAt?: number
  createdAt: number
}

export interface ArchivedWeek {
  id: string // uuid
  startDateISO: string // selectedStartDate at time of scheduling
  dates: string[] // 7 ISO dates from getWeekWindow
  tasks: WeeklyTask[] // snapshot at time of "Schedule All Tasks"
  createdAtISO: string
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
    priority: {
      urgent: string
      scheduled: string
      optional: string
    }
    difficulty: {
      light: string
      standard: string
      challenging: string
    }
  }
  parentLock: {
    enabled: boolean
    password: string
    securityQuestion: string
    securityAnswer: string
  }
  preferences: {
    soundEnabled: boolean
    theme: string
    timezone?: string
    wakeTime?: string
    sleepTime?: string
    preferredFocusPeriod?: "morning" | "afternoon" | "evening"
    maxPlannedMinutesPerDay?: number
  }
  schemaVersion?: 2
  voice?: {
    languageTag: string
    hasAcknowledgedDisclosure: boolean
  }
}

export interface UserProfile {
  initials: string;      // 1–2 chars, A–Z0–9, uppercased
  bgColor: string;       // hex or Tailwind token
}
