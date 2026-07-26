"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, CheckCircle2, LineChart, PlusCircle, SettingsIcon, Trophy } from "lucide-react"
import TodoPage from "./todo-page"
import JarsPage from "./jars-page"
import WeeklyDumpPage from "./weekly-dump-page"
import HistoryModal from "./history-modal"
import AddTaskModal from "./add-task-modal"
import PlanReviewModal from "./plan-review-modal"
import { createLocalPlan, type GeneratedTask } from "../lib/local-planner"
import { freshJar, mergeSettings, readLocalTaskJarState, saveLocalTaskJarState } from "../lib/taskjar-repository"
import type { AppSettings, Jar, Task } from "../types"

const DEFAULTS: AppSettings = {
  studentName: "", schemaVersion: 2, xpValues: { light: 5, standard: 10, challenging: 15 }, jarTarget: 100,
  emojis: { priority: { urgent: "🔴", scheduled: "🟡", optional: "🟢" }, difficulty: { light: "🍃", standard: "⚡", challenging: "🔥" } },
  parentLock: { enabled: false, password: "", securityQuestion: "", securityAnswer: "" },
  preferences: { soundEnabled: true, theme: "dark", timezone: "UTC", wakeTime: "07:00", sleepTime: "23:00", preferredFocusPeriod: "morning", maxPlannedMinutesPerDay: 360 },
  voice: { languageTag: "en", hasAcknowledgedDisclosure: false },
}

export default function LocalTaskJarApp() {
  const [ready, setReady] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([]), [jars, setJars] = useState<Jar[]>([]), [settings, setSettings] = useState<AppSettings>(DEFAULTS)
  const [section, setSection] = useState<"todo" | "jars" | "dump" | "analytics" | "settings">("todo")
  const [showAdd, setShowAdd] = useState(false), [showHistory, setShowHistory] = useState(false)
  const [drafts, setDrafts] = useState<GeneratedTask[] | null>(null), [planWarnings, setPlanWarnings] = useState<string[]>([]), [transcript, setTranscript] = useState("")

  useEffect(() => { const state = readLocalTaskJarState(DEFAULTS); setTasks(state.tasks); setJars(state.jars); setSettings(state.settings); setReady(true) }, [])
  useEffect(() => { if (ready) saveLocalTaskJarState({ schemaVersion: 2, tasks, jars, settings, metadata: { lastSavedAt: Date.now() } }) }, [ready, tasks, jars, settings])
  const currentJar = useMemo(() => jars.find(jar => !jar.completed) || null, [jars])
  const sound = (type: "click" | "complete" | "generate") => {
    if (!settings.preferences.soundEnabled || typeof window === "undefined") return
    const context = new AudioContext(), oscillator = context.createOscillator(), gain = context.createGain()
    oscillator.connect(gain); gain.connect(context.destination); oscillator.frequency.value = type === "complete" ? 660 : type === "generate" ? 520 : 800; gain.gain.setValueAtTime(.08, context.currentTime); gain.gain.exponentialRampToValueAtTime(.01, context.currentTime + .18); oscillator.start(); oscillator.stop(context.currentTime + .18)
  }
  const addTask = (input: Omit<Task, "id" | "completed" | "completedAt" | "createdAt"> & Partial<Pick<Task, "createdAt">>) => { setTasks(previous => [...previous, { ...input, id: crypto.randomUUID(), createdAt: input.createdAt || Date.now(), completed: false, source: input.source || "manual" }]); sound("click") }
  const updateTask = async (id: string, changes: Partial<Task>) => { setTasks(previous => previous.map(task => task.id === id ? { ...task, ...changes } : task)); return tasks.find(task => task.id === id)! }
  const deleteTask = async (id: string) => { setTasks(previous => previous.filter(task => task.id !== id)); setJars(previous => previous.map(jar => ({ ...jar, tasks: jar.tasks.filter(taskId => taskId !== id) }))) }
  const completeTask = (id: string) => {
    const task = tasks.find(item => item.id === id), jar = currentJar
    if (!task || !jar || task.completed) return
    sound("complete")
    setTasks(previous => previous.map(item => item.id === id ? { ...item, completed: true, completedAt: Date.now(), xpAwarded: true } : item))
    const xp = jar.currentXP + task.xpValue
    if (xp >= jar.targetXP) {
      const completed = { ...jar, currentXP: jar.targetXP, completed: true, completedAt: Date.now(), tasks: [...jar.tasks, id] }
      setJars(previous => [...previous.filter(item => item.id !== jar.id), completed, { ...freshJar(settings.jarTarget), currentXP: xp - jar.targetXP }])
    } else setJars(previous => previous.map(item => item.id === jar.id ? { ...item, currentXP: xp, tasks: [...item.tasks, id] } : item))
  }
  const requestPlan = (value: string) => { const result = createLocalPlan(value, new Date().toISOString().slice(0, 10), settings); setTranscript(value); setDrafts(result.tasks); setPlanWarnings(result.warnings); sound("generate") }
  const acceptPlan = () => {
    if (!drafts) return
    const accepted: Task[] = drafts.filter(task => task.selected).map(task => ({ id: crypto.randomUUID(), name: task.name, description: task.description, priority: task.priority, difficulty: task.difficulty, priorityEmoji: settings.emojis.priority[task.priority], difficultyEmoji: settings.emojis.difficulty[task.difficulty], xpValue: Math.max(5, Math.min(40, Math.round((task.estimatedMinutes || 30) / 10) + settings.xpValues[task.difficulty])), completed: false, createdAt: Date.now(), scheduledFor: task.scheduledFor, source: "voice-ai", aiGenerated: true, estimatedMinutes: task.estimatedMinutes, energy: task.energy, suggestedStartTime: task.suggestedStartTime, preferredDaypart: task.preferredDaypart, timingConstraintSource: task.timingConstraintSource, timingReason: task.timingReason, subtasks: task.subtasks, warnings: task.warnings, planningConfidence: .65 }))
    setTasks(previous => [...previous, ...accepted]); setDrafts(null); sound("generate")
  }
  const updateSettings = (next: AppSettings) => setSettings(mergeSettings(DEFAULTS, next))
  const clearAll = () => { if (!confirm("Delete all locally stored TaskJar tasks and jars?")) return; setTasks([]); setJars([freshJar(settings.jarTarget)]) }
  if (!ready) return <div className="min-h-screen bg-black flex items-center justify-center text-green-400">Loading your local TaskJar…</div>
  const completed = tasks.filter(task => task.completed).length, minutes = tasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0)
  return <div className="min-h-screen bg-black text-white"><div className="container mx-auto px-4 pb-24">
    {section === "todo" && <div className="fixed top-6 left-6 z-40"><button onClick={() => setShowAdd(true)} className="bg-black/90 backdrop-blur-xl border border-green-500/30 shadow-lg shadow-green-500/20 rounded-full p-3 hover:bg-green-600/20"><PlusCircle className="w-5 h-5 text-green-400" /></button></div>}
    {section === "todo" && <TodoPage tasks={tasks} updateTask={updateTask} addTasks={async inputs => inputs.forEach(addTask)} settings={settings} completeTask={completeTask} deleteTask={deleteTask} playSound={sound} onPlanRequest={requestPlan} />}
    {section === "jars" && <JarsPage jars={jars} currentJar={currentJar} settings={settings} tasks={tasks} />}
    {section === "dump" && <WeeklyDumpPage settings={settings} weeklyTasks={[]} addWeeklyTask={async task => ({ ...task, id: crypto.randomUUID(), createdAt: Date.now() })} updateWeeklyTask={async () => { throw new Error("Weekly drafts are local to this screen") }} deleteWeeklyTask={async () => {}} completeWeeklyTask={async () => { throw new Error("Weekly drafts are local to this screen") }} archivedWeeks={[]} archiveWeek={async () => {}} handleAddTasks={async inputs => inputs.forEach(addTask)} playSound={sound} />}
    {section === "analytics" && <div className="mt-24 grid gap-5 md:grid-cols-3"><div className="bg-white/10 border border-white/20 rounded-xl p-6"><p className="text-gray-400">Completed tasks</p><b className="text-4xl text-green-400">{completed}</b></div><div className="bg-white/10 border border-white/20 rounded-xl p-6"><p className="text-gray-400">Completion rate</p><b className="text-4xl text-green-400">{tasks.length ? Math.round(completed / tasks.length * 100) : 0}%</b></div><div className="bg-white/10 border border-white/20 rounded-xl p-6"><p className="text-gray-400">Planned minutes</p><b className="text-4xl text-green-400">{minutes}</b></div><p className="md:col-span-3 text-gray-400">These analytics are calculated only from data stored in this browser.</p></div>}
    {section === "settings" && <div className="mt-24 max-w-xl space-y-5"><div className="bg-white/10 border border-white/20 rounded-xl p-6 space-y-4"><h2 className="text-2xl font-bold">Local settings</h2><label className="block text-sm">Name<input value={settings.studentName} onChange={event => updateSettings({ ...settings, studentName: event.target.value })} className="mt-1 w-full rounded bg-black/30 border border-white/20 p-2" /></label><label className="block text-sm">Daily planning limit (minutes)<input type="number" min="60" max="960" value={settings.preferences.maxPlannedMinutesPerDay || 360} onChange={event => updateSettings({ ...settings, preferences: { ...settings.preferences, maxPlannedMinutesPerDay: Number(event.target.value) || 360 } })} className="mt-1 w-full rounded bg-black/30 border border-white/20 p-2" /></label><label className="flex gap-2 items-center"><input type="checkbox" checked={settings.preferences.soundEnabled} onChange={event => updateSettings({ ...settings, preferences: { ...settings.preferences, soundEnabled: event.target.checked } })} /> Sounds</label><button onClick={() => setShowHistory(true)} className="rounded bg-green-600 px-4 py-2">View completed history</button><button onClick={clearAll} className="ml-3 rounded border border-red-400 text-red-300 px-4 py-2">Clear local data</button></div></div>}
  </div>
  <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} tasks={tasks} onDeleteTask={id => void deleteTask(id)} playSound={sound} />
  <AddTaskModal isOpen={showAdd} onClose={() => setShowAdd(false)} onAddTask={addTask} settings={settings} />
  {drafts && <PlanReviewModal drafts={drafts} onChange={setDrafts} warnings={planWarnings} transcript={transcript} onAccept={acceptPlan} onRegenerate={() => requestPlan(transcript)} onRegenerateTask={index => { const result = createLocalPlan(drafts[index].description || drafts[index].name, drafts[index].scheduledFor, settings); setDrafts(current => current ? current.map((task, item) => item === index ? result.tasks[0] : task) : current) }} onClose={() => setDrafts(null)} />}
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"><div className="bg-black/80 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20 flex gap-4">{[["todo", CheckCircle2], ["jars", Trophy], ["dump", Calendar], ["analytics", LineChart], ["settings", SettingsIcon]].map(([name, Icon]) => <button key={String(name)} onClick={() => { setSection(name as typeof section); sound("click") }} className={`p-3 rounded-full ${section === name ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"}`} aria-label={String(name)}>{<Icon className="w-5 h-5" />}</button>)}</div></div>
  </div>
}
