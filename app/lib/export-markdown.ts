import { format } from "date-fns"
import type { AppSettings, Jar, Task } from "../types"

function safeDate(timestamp?: number): string {
  if (!timestamp) return "—"
  return format(new Date(timestamp), "yyyy-MM-dd HH:mm")
}

function taskLine(task: Task): string {
  const status = task.completed ? "x" : " "
  const date = task.scheduledFor ?? format(new Date(task.createdAt), "yyyy-MM-dd")
  const subtasks = (task.subtasks || []).length
    ? `\n  - Subtasks:\n${(task.subtasks || []).map((subtask) => `    - [${subtask.completed ? "x" : " "}] ${subtask.title}${subtask.estimatedMinutes ? ` (${subtask.estimatedMinutes} min)` : ""}`).join("\n")}`
    : ""
  return `- [${status}] **${task.name}**
  - Date: ${date}
  - Suggested time: ${task.suggestedStartTime || "Flexible"}
  - Timing basis: ${task.timingConstraintSource || "none"}${task.timingReason ? ` — ${task.timingReason}` : ""}
  - Priority: ${task.priority}
  - Difficulty: ${task.difficulty}
  - Energy: ${task.energy || "not recorded"}
  - Estimated active time: ${task.estimatedMinutes ? `${task.estimatedMinutes} min` : "not estimated"}
  - Actual active time: ${task.actualMinutes ? `${task.actualMinutes} min` : "not recorded"}
  - XP: ${task.xpValue}${task.xpAwarded ? " (awarded)" : ""}
  - Source: ${task.source ?? "manual"}
  - Description: ${task.description || "No description"}
  - Created: ${safeDate(task.createdAt)}
  - Completed: ${safeDate(task.completedAt)}${subtasks}`
}

export function buildJourneyMarkdown(tasks: Task[], jars: Jar[], settings: AppSettings): string {
  const completed = tasks.filter((task) => task.completed)
  const pending = tasks.filter((task) => !task.completed)
  const totalXP = completed.filter((task) => task.xpAwarded !== false).reduce((sum, task) => sum + task.xpValue, 0)
  const completedJars = jars.filter((jar) => jar.completed)
  const estimated = tasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0)
  const actual = tasks.reduce((sum, task) => sum + (task.actualMinutes || 0), 0)
  const sortedTasks = [...tasks].sort((a, b) => {
    const aDate = a.scheduledFor ?? format(new Date(a.createdAt), "yyyy-MM-dd")
    const bDate = b.scheduledFor ?? format(new Date(b.createdAt), "yyyy-MM-dd")
    return aDate.localeCompare(bDate) || a.createdAt - b.createdAt
  })
  const grouped = sortedTasks.reduce<Record<string, Task[]>>((groups, task) => {
    const key = task.scheduledFor ?? format(new Date(task.createdAt), "yyyy-MM-dd")
    groups[key] = [...(groups[key] ?? []), task]
    return groups
  }, {})
  const timeline = Object.entries(grouped).map(([date, dateTasks]) => `### ${date}\n\n${dateTasks.map(taskLine).join("\n\n")}`).join("\n\n")
  const jarHistory = jars.map((jar, index) => `- Jar ${index + 1}: ${jar.completed ? "completed" : "active"}, ${jar.currentXP}/${jar.targetXP} XP, ${jar.tasks.length} linked tasks${jar.completedAt ? `, completed ${safeDate(jar.completedAt)}` : ""}`).join("\n")

  return `# TaskJar Journey Export

> A local-first productivity history exported from TaskJar. This file contains no account or cloud identifiers and does not include full voice transcripts.

- **Owner:** ${settings.studentName || "TaskJar user"}
- **Exported:** ${safeDate(Date.now())}
- **Total tasks:** ${tasks.length}
- **Completed:** ${completed.length}
- **Pending:** ${pending.length}
- **Completion rate:** ${tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0}%
- **XP earned:** ${totalXP}
- **Completed jars:** ${completedJars.length}
- **Total estimated time:** ${estimated ? `${estimated} min` : "not available"}
- **Total recorded actual time:** ${actual ? `${actual} min` : "not available"}

## Current focus

${pending.length ? pending.map(taskLine).join("\n\n") : "No pending tasks."}

## Full timeline

${timeline || "No task history yet."}

## Jar milestones

${jarHistory || "No jars yet."}

## AI handoff prompt

Use the TaskJar history above as execution context. Summarise my completion patterns, unfinished commitments, estimate accuracy, recurring bottlenecks, and strongest areas. Then propose a realistic next plan that preserves unfinished work, avoids duplicating completed work, respects the timing evidence recorded above, and clearly distinguishes assumptions from facts.
`
}

export function downloadJourneyMarkdown(tasks: Task[], jars: Jar[], settings: AppSettings): void {
  const markdown = buildJourneyMarkdown(tasks, jars, settings)
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `taskjar-journey-${format(new Date(), "yyyy-MM-dd")}.md`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
