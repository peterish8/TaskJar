"use client"

import { useState } from "react"
import { Calendar, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createLocalPlan, type GeneratedTask } from "../lib/local-planner"
import type { AppSettings, ArchivedWeek, Task, WeeklyTask } from "../types"

interface Props {
  settings: AppSettings
  weeklyTasks: WeeklyTask[]
  addWeeklyTask: (task: Omit<WeeklyTask, "id" | "createdAt">) => Promise<WeeklyTask>
  updateWeeklyTask: (id: string, updates: Partial<WeeklyTask>) => Promise<WeeklyTask>
  deleteWeeklyTask: (id: string) => Promise<void>
  completeWeeklyTask: (id: string) => Promise<WeeklyTask>
  archivedWeeks: ArchivedWeek[]
  archiveWeek: (week: ArchivedWeek) => Promise<void>
  handleAddTasks: (tasks: Omit<Task, "id" | "completed" | "completedAt" | "createdAt">[]) => Promise<void>
  playSound: (type: "click" | "complete" | "generate") => void
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
function nextDate(day: string): string { const now = new Date(), target = days.indexOf(day), offset = (target - ((now.getDay() + 6) % 7) + 7) % 7; const date = new Date(now); date.setDate(now.getDate() + offset); return date.toISOString().slice(0, 10) }

export default function WeeklyDumpPage({ settings, handleAddTasks, playSound }: Props) {
  const [input, setInput] = useState(""), [drafts, setDrafts] = useState<GeneratedTask[]>([])
  const process = () => { if (!input.trim()) return; const plan = createLocalPlan(input, new Date().toISOString().slice(0, 10), settings); setDrafts(plan.tasks.map((task, index) => ({ ...task, scheduledFor: nextDate(days[index % days.length]) }))); playSound("generate") }
  const save = async () => { await handleAddTasks(drafts.filter(task => task.selected).map(task => ({ name: task.name, description: task.description, priority: task.priority, difficulty: task.difficulty, priorityEmoji: settings.emojis.priority[task.priority], difficultyEmoji: settings.emojis.difficulty[task.difficulty], xpValue: settings.xpValues[task.difficulty], scheduledFor: task.scheduledFor, source: "weekly-ai", aiGenerated: true, estimatedMinutes: task.estimatedMinutes, energy: task.energy, suggestedStartTime: task.suggestedStartTime, preferredDaypart: task.preferredDaypart, timingConstraintSource: task.timingConstraintSource, timingReason: task.timingReason, subtasks: task.subtasks, warnings: task.warnings }))); setDrafts([]); setInput(""); playSound("click") }
  return <div className="space-y-6 mt-20"><Card className="bg-white/10 backdrop-blur-md border-white/20"><CardHeader><CardTitle className="flex items-center gap-2 matrix-font"><Calendar className="w-5 h-5" />Weekly Planner</CardTitle></CardHeader><CardContent><div className="space-y-4"><Textarea value={input} onChange={event => setInput(event.target.value)} placeholder="Describe your week naturally. Mention days, deadlines, and time preferences…" className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-32" /><p className="text-xs text-gray-400">Plans are generated in this browser and remain editable before you save them.</p><Button onClick={process} disabled={!input.trim()} className="bg-green-600 hover:bg-green-700 w-full font-bold"><Zap className="w-4 h-4 mr-2" />Build Local Weekly Plan</Button></div></CardContent></Card>
  {drafts.length > 0 && <div className="space-y-4"><div className="flex justify-between items-center"><h3 className="text-xl font-semibold text-green-300">Review Weekly Plan</h3><Button onClick={save} className="bg-green-600 hover:bg-green-700">Save Selected Tasks</Button></div>{drafts.map((task, index) => <Card key={task.clientId} className="bg-white/10 backdrop-blur-md border-white/20"><CardContent className="p-4 flex gap-3 items-start"><input type="checkbox" checked={task.selected} onChange={event => setDrafts(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, selected: event.target.checked } : item))} /><div className="flex-1"><div className="flex justify-between gap-2"><b>{task.name}</b><Badge>{task.estimatedMinutes} min</Badge></div><p className="text-sm text-gray-300 mt-1">{task.description}</p><div className="flex gap-2 mt-3"><input type="date" value={task.scheduledFor} onChange={event => setDrafts(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, scheduledFor: event.target.value } : item))} className="bg-black/30 border border-white/20 rounded px-2" /><Badge variant="outline">{task.priority}</Badge><Badge variant="outline">{task.energy} energy</Badge></div></div></CardContent></Card>)}</div>}</div>
}
