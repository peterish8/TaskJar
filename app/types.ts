export interface Task {
  id: string
  name: string
  description: string
  priority: "urgent" | "scheduled" | "optional"
  difficulty: "light" | "standard" | "challenging"
  priorityEmoji: string
  difficultyEmoji: string
  xpValue: number
  completed: boolean
  completedAt?: number
  createdAt: number
  scheduledFor?: string
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
  }
}

export interface UserProfile {
  initials: string;      // 1–2 chars, A–Z0–9, uppercased
  bgColor: string;       // hex or Tailwind token
}
