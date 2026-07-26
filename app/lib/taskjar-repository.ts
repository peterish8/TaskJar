import type { AppSettings, Jar, Task } from "../types"

const STATE_KEY = "taskjar_state_v2"
const LEGACY_BACKUP_KEY = "taskjar_legacy_backup_v1"
const LEGACY = { tasks: "taskjar_tasks", jars: "taskjar_jars", settings: "taskjar_settings" }

export interface PersistedTaskJarStateV2 {
  schemaVersion: 2
  tasks: Task[]
  jars: Jar[]
  settings: AppSettings
  metadata: { migratedAt?: number; lastSavedAt: number }
}

export function readLocalTaskJarState(defaults: AppSettings): PersistedTaskJarStateV2 {
  const fallback = (): PersistedTaskJarStateV2 => ({
    schemaVersion: 2, tasks: [], jars: [freshJar(defaults.jarTarget)], settings: defaults,
    metadata: { lastSavedAt: Date.now() },
  })
  try {
    const saved = localStorage.getItem(STATE_KEY)
    if (saved) {
      const state = JSON.parse(saved) as Partial<PersistedTaskJarStateV2>
      if (state.schemaVersion === 2 && Array.isArray(state.tasks) && Array.isArray(state.jars)) {
        const settings = mergeSettings(defaults, state.settings)
        return { schemaVersion: 2, tasks: state.tasks.map(task => migrateTask(task, settings)), jars: state.jars.length ? state.jars : [freshJar(settings.jarTarget)], settings, metadata: { ...state.metadata, lastSavedAt: state.metadata?.lastSavedAt || Date.now() } }
      }
    }
    const legacy = { tasks: localStorage.getItem(LEGACY.tasks), jars: localStorage.getItem(LEGACY.jars), settings: localStorage.getItem(LEGACY.settings) }
    if (Object.values(legacy).some(Boolean) && !localStorage.getItem(LEGACY_BACKUP_KEY)) localStorage.setItem(LEGACY_BACKUP_KEY, JSON.stringify({ backedUpAt: Date.now(), ...legacy }))
    const settings = mergeSettings(defaults, legacy.settings ? JSON.parse(legacy.settings) : undefined)
    const tasks = legacy.tasks ? (JSON.parse(legacy.tasks) as Partial<Task>[]).map(task => migrateTask(task, settings)) : []
    const jars = legacy.jars ? JSON.parse(legacy.jars) as Jar[] : []
    const state: PersistedTaskJarStateV2 = { schemaVersion: 2, tasks, jars: jars.length ? jars : [freshJar(settings.jarTarget)], settings, metadata: { migratedAt: Date.now(), lastSavedAt: Date.now() } }
    saveLocalTaskJarState(state)
    return state
  } catch { return fallback() }
}

export function saveLocalTaskJarState(state: PersistedTaskJarStateV2): void {
  localStorage.setItem(STATE_KEY, JSON.stringify({ ...state, schemaVersion: 2, metadata: { ...state.metadata, lastSavedAt: Date.now() } }))
}

export function freshJar(targetXP: number): Jar { return { id: crypto.randomUUID(), name: "My Jar", currentXP: 0, targetXP, completed: false, tasks: [] } }

export function mergeSettings(defaults: AppSettings, value?: Partial<AppSettings>): AppSettings {
  return {
    ...defaults, ...value, schemaVersion: 2,
    xpValues: { ...defaults.xpValues, ...value?.xpValues }, jarTarget: value?.jarTarget || defaults.jarTarget,
    emojis: { priority: { ...defaults.emojis.priority, ...value?.emojis?.priority }, difficulty: { ...defaults.emojis.difficulty, ...value?.emojis?.difficulty } },
    preferences: { ...defaults.preferences, ...value?.preferences, timezone: value?.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", wakeTime: value?.preferences?.wakeTime || "07:00", sleepTime: value?.preferences?.sleepTime || "23:00", preferredFocusPeriod: value?.preferences?.preferredFocusPeriod || "morning", maxPlannedMinutesPerDay: value?.preferences?.maxPlannedMinutesPerDay || 360 },
    voice: { languageTag: value?.voice?.languageTag || "en", hasAcknowledgedDisclosure: Boolean(value?.voice?.hasAcknowledgedDisclosure) },
  }
}

export function migrateTask(value: Partial<Task>, settings: AppSettings): Task {
  const difficulty = value.difficulty || "standard", priority = value.priority || "optional"
  return { id: value.id || crypto.randomUUID(), name: value.name || "Untitled task", description: value.description || "", priority, difficulty, priorityEmoji: value.priorityEmoji || settings.emojis.priority[priority], difficultyEmoji: value.difficultyEmoji || settings.emojis.difficulty[difficulty], xpValue: value.xpValue || settings.xpValues[difficulty], completed: Boolean(value.completed), completedAt: value.completedAt, createdAt: value.createdAt || Date.now(), scheduledFor: value.scheduledFor, source: value.source || "legacy", estimatedMinutes: value.estimatedMinutes, energy: value.energy, suggestedStartTime: value.suggestedStartTime, preferredDaypart: value.preferredDaypart, timingConstraintSource: value.timingConstraintSource, timingReason: value.timingReason, subtasks: value.subtasks || [], actualMinutes: value.actualMinutes, warnings: value.warnings || [], aiGenerated: value.aiGenerated, planningConfidence: value.planningConfidence, xpAwarded: value.xpAwarded }
}
