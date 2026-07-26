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

interface RepositoryOptions {
  defaults: AppSettings
  mergeSettings: (value?: Partial<AppSettings>) => AppSettings
  migrateTask: (value: Partial<Task>) => Task
  freshJar: (target: number) => Jar
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try { return JSON.parse(value) as T } catch { return fallback }
}

export class LocalStorageTaskJarRepository {
  constructor(private readonly options: RepositoryOptions) {}

  load(): PersistedTaskJarStateV2 {
    const stored = parseJson<Partial<PersistedTaskJarStateV2> | null>(localStorage.getItem(STATE_KEY), null)
    if (stored?.schemaVersion === 2 && Array.isArray(stored.tasks) && Array.isArray(stored.jars)) {
      const settings = this.options.mergeSettings(stored.settings)
      return {
        schemaVersion: 2,
        tasks: stored.tasks.map(this.options.migrateTask),
        jars: stored.jars.length ? stored.jars : [this.options.freshJar(settings.jarTarget)],
        settings,
        metadata: { migratedAt: stored.metadata?.migratedAt, lastSavedAt: stored.metadata?.lastSavedAt || Date.now() },
      }
    }

    const rawLegacy = { tasks: localStorage.getItem(LEGACY.tasks), jars: localStorage.getItem(LEGACY.jars), settings: localStorage.getItem(LEGACY.settings) }
    if (!localStorage.getItem(LEGACY_BACKUP_KEY) && Object.values(rawLegacy).some(Boolean)) localStorage.setItem(LEGACY_BACKUP_KEY, JSON.stringify({ backedUpAt: Date.now(), ...rawLegacy }))
    const settings = this.options.mergeSettings(parseJson<Partial<AppSettings> | undefined>(rawLegacy.settings, undefined))
    const tasks = parseJson<Partial<Task>[]>(rawLegacy.tasks, []).map(this.options.migrateTask)
    const jars = parseJson<Jar[]>(rawLegacy.jars, [])
    const migrated: PersistedTaskJarStateV2 = { schemaVersion: 2, tasks, jars: jars.length ? jars : [this.options.freshJar(settings.jarTarget)], settings, metadata: { migratedAt: Date.now(), lastSavedAt: Date.now() } }
    this.save(migrated)
    return migrated
  }

  save(state: Omit<PersistedTaskJarStateV2, "schemaVersion" | "metadata"> & { metadata?: Partial<PersistedTaskJarStateV2["metadata"]> }): void {
    const envelope: PersistedTaskJarStateV2 = { schemaVersion: 2, tasks: state.tasks, jars: state.jars, settings: state.settings, metadata: { migratedAt: state.metadata?.migratedAt, lastSavedAt: Date.now() } }
    localStorage.setItem(STATE_KEY, JSON.stringify(envelope))
    // Keep the original workspace components, analytics and JSON backup tools compatible.
    localStorage.setItem(LEGACY.tasks, JSON.stringify(state.tasks))
    localStorage.setItem(LEGACY.jars, JSON.stringify(state.jars))
    localStorage.setItem(LEGACY.settings, JSON.stringify(state.settings))
  }
}
