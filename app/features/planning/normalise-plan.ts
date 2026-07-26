import { planResultSchema } from "./schemas"
import type { AppSettings, GeneratedTask, PlanResult } from "../../types"

const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

export function normalisePlan(tasks: GeneratedTask[], settings: AppSettings): PlanResult {
  const normalised = tasks.slice(0, 30).map((task) => ({
    ...task,
    clientId: task.clientId || uid(),
    selected: task.selected !== false,
    estimatedMinutes: Math.max(5, Math.min(480, Math.round((task.estimatedMinutes || 30) / 5) * 5)),
    planningConfidence: Math.max(0, Math.min(1, task.planningConfidence ?? 0.65)),
    subtasks: (task.subtasks || []).slice(0, 5).map((subtask) => ({
      ...subtask,
      id: subtask.id || uid(),
      completed: Boolean(subtask.completed),
      estimatedMinutes: subtask.estimatedMinutes ? Math.max(1, Math.min(240, Math.round(subtask.estimatedMinutes))) : undefined,
    })),
    warnings: (task.warnings || []).slice(0, 8),
  }))

  const planningWarnings: string[] = []
  const totalEstimatedMinutes = normalised.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0)
  if (totalEstimatedMinutes > settings.preferences.maxPlannedMinutesPerDay) {
    planningWarnings.push(`This plan contains about ${totalEstimatedMinutes} minutes of work, above your ${settings.preferences.maxPlannedMinutesPerDay}-minute daily limit. Lower-priority tasks are left flexible for review.`)
    let remaining = settings.preferences.maxPlannedMinutesPerDay
    for (const task of normalised.sort((a, b) => ({ urgent: 0, scheduled: 1, optional: 2 }[a.priority] - { urgent: 0, scheduled: 1, optional: 2 }[b.priority]))) {
      remaining -= task.estimatedMinutes || 0
      if (remaining < 0 && task.priority === "optional") {
        task.suggestedStartTime = undefined
        task.preferredDaypart = "anytime"
        task.timingConstraintSource = "none"
        task.timingReason = "The day is overloaded, so this optional task remains flexible."
      }
    }
  }

  const occupied = new Map<string, GeneratedTask>()
  for (const task of normalised) {
    if (!task.suggestedStartTime || !task.scheduledFor) continue
    const key = `${task.scheduledFor}-${task.suggestedStartTime}`
    const collision = occupied.get(key)
    if (!collision) {
      occupied.set(key, task)
      continue
    }
    if (task.timingConstraintSource === "explicit" && collision.timingConstraintSource === "explicit") {
      task.warnings = [...(task.warnings || []), `This exact time overlaps with “${collision.name}”. Review both explicit constraints.`]
      planningWarnings.push(`Two explicit tasks overlap at ${task.suggestedStartTime}: “${collision.name}” and “${task.name}”.`)
    } else if (task.timingConstraintSource !== "explicit") {
      task.suggestedStartTime = undefined
      task.timingReason = "An inferred exact time overlapped another task, so this remains flexible."
      task.timingConstraintSource = "none"
    }
  }

  return planResultSchema.parse({ tasks: normalised, totalEstimatedMinutes, planningWarnings, unparsedNotes: [] })
}
