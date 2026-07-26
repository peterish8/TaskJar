import { format } from "date-fns"
import type { AppSettings, Jar, Task } from "../types"

function safeDate(timestamp?: number): string {
  if (!timestamp) return "—"
  return format(new Date(timestamp), "yyyy-MM-dd HH:mm")
}

function taskLine(task: Task): string {
  const status = task.completed ? "x" : " "
  const date = task.scheduledFor ?? format(new Date(task.createdAt), "yyyy-MM-dd")
  return `- [${status}] **${task.name}**\n  - Date: ${date}\n  - Priority: ${task.priority}\n  - Difficulty: ${task.difficulty}\n  - XP: ${task.xpValue}\n  - Source: ${task.source ?? "manual"}\n  - Description: ${task.description || "No description"}\n  - Created: ${safeDate(task.createdAt)}\n  - Completed: ${safeDate(task.completedAt)}`
}

export function buildJourneyMarkdown(tasks: Task[], jars: Jar[], settings: AppSettings): string {
  const completed = tasks.filter((task) => task.completed)
  const pending = tasks.filter((task) => !task.completed)
  const totalXP = completed.reduce((sum, task) => sum + task.xpValue, 0)
  const completedJars = jars.filter((jar) => jar.completed)
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

> A local-first productivity history exported from TaskJar. This file contains no account or cloud identifiers.

- **Owner:** ${settings.studentName || "TaskJar user"}
- **Exported:** ${safeDate(Date.now())}
- **Total tasks:** ${tasks.length}
- **Completed:** ${completed.length}
- **Pending:** ${pending.length}
- **Completion rate:** ${tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0}%
- **XP earned:** ${totalXP}
- **Completed jars:** ${completedJars.length}

## Current focus

${pending.length ? pending.map(taskLine).join("\n\n") : "No pending tasks."}

## Full timeline

${timeline || "No task history yet."}

## Jar milestones

${jarHistory || "No jars yet."}

## AI handoff prompt

Use the TaskJar history above as context. First summarise my execution patterns, unfinished commitments, recurring bottlenecks, and strongest areas. Then propose a realistic next plan that preserves unfinished work, avoids duplicating completed work, and clearly distinguishes assumptions from facts.
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
