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
