"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { CalendarDays, Check, ChevronDown, ChevronRight, Circle, Clock3, Download, Gauge, Home, Loader2, Plus, Settings, Sparkles, Trash2, Trophy } from "lucide-react"
import { parseISO } from "date-fns"
import ModelManager from "./components/model-manager"
import PlanReviewModal from "./components/plan-review-modal"
import VoiceCaptureCard from "./features/voice-capture/components/voice-capture-card"
import type { AppSettings, Difficulty, GeneratedTask, Jar, Priority, Subtask, Task, TaskSource } from "./types"
import { generateOnDevice, getInstalledModelIds, hasWebGpu } from "./lib/local-ai"
import { DAYS, buildDailyPrompt, buildWeeklyPrompt, extractJsonArray, fallbackDailyPlan, fallbackWeeklyPlan, finalisePlan, getMonday, getWeekDateMap, normalizeGeneratedDaily, normalizeGeneratedWeekly, toDateKey } from "./lib/planner"
import { buildJourneyMarkdown, downloadJourneyMarkdown } from "./lib/export-markdown"
import { LocalStorageTaskJarRepository } from "./lib/taskjar-repository"
import { calculateTaskXP } from "./features/planning/xp-policy"

type View = "today" | "week" | "journey" | "settings"
type PlanMode = "daily" | "weekly"
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
const freshJar = (target: number): Jar => ({ id: uid(), currentXP: 0, targetXP: target, completed: false, tasks: [] })

const base: AppSettings = {
  schemaVersion: 2,
  studentName: "Student",
  xpValues: { light: 5, standard: 10, challenging: 15 },
  jarTarget: 100,
  emojis: { priority: { urgent: "🔴", scheduled: "🟡", optional: "🟢" }, difficulty: { light: "🍃", standard: "⚡", challenging: "🔥" } },
  preferences: { soundEnabled: false, timezone: "Asia/Kolkata", theme: "dark", wakeTime: "07:00", sleepTime: "23:00", preferredFocusPeriod: "morning", maxPlannedMinutesPerDay: 360 },
  localAI: { selectedModelId: "gemma-270m" },
  voice: { modelId: "whisper-tiny.en", languageTag: "en", hasAcknowledgedDisclosure: false },
}

function mergeSettings(value?: Partial<AppSettings>): AppSettings {
  return {
    ...base, ...value, schemaVersion: 2,
    xpValues: { ...base.xpValues, ...value?.xpValues },
    emojis: { priority: { ...base.emojis.priority, ...value?.emojis?.priority }, difficulty: { ...base.emojis.difficulty, ...value?.emojis?.difficulty } },
    preferences: { ...base.preferences, ...value?.preferences, theme: "dark" },
    localAI: { ...base.localAI, ...value?.localAI },
    voice: { ...base.voice, ...value?.voice },
  }
}

function migrateTask(value: Partial<Task>): Task {
  const priority = (["urgent", "scheduled", "optional"].includes(String(value.priority)) ? value.priority : "optional") as Priority
  const difficulty = (["light", "standard", "challenging"].includes(String(value.difficulty)) ? value.difficulty : "standard") as Difficulty
  let scheduledFor = value.scheduledFor
  if (scheduledFor && !/^\d{4}-\d{2}-\d{2}$/.test(scheduledFor)) {
    const parsed = new Date(scheduledFor)
    scheduledFor = Number.isNaN(parsed.getTime()) ? undefined : toDateKey(parsed)
  }
  const subtasks: Subtask[] = Array.isArray(value.subtasks) ? value.subtasks.slice(0, 5).map((item) => ({ id: item.id || uid(), title: item.title || "Next step", completed: Boolean(item.completed), estimatedMinutes: item.estimatedMinutes, completedAt: item.completedAt })) : []
  return {
    id: value.id || uid(), name: value.name || "Untitled task", description: value.description || "", priority, difficulty,
    priorityEmoji: value.priorityEmoji || base.emojis.priority[priority], difficultyEmoji: value.difficultyEmoji || base.emojis.difficulty[difficulty],
    xpValue: Number(value.xpValue) || base.xpValues[difficulty], completed: Boolean(value.completed), completedAt: value.completedAt,
    createdAt: Number(value.createdAt) || Date.now(), scheduledFor, source: value.source || "manual", originalPrompt: value.originalPrompt,
    estimatedMinutes: value.estimatedMinutes, energy: value.energy, suggestedStartTime: value.suggestedStartTime, preferredDaypart: value.preferredDaypart,
    timingConstraintSource: value.timingConstraintSource, timingReason: value.timingReason, sourceTranscript: value.sourceTranscript,
    aiGenerated: Boolean(value.aiGenerated), planningConfidence: value.planningConfidence, subtasks, actualMinutes: value.actualMinutes,
    warnings: value.warnings || [], xpAwarded: value.xpAwarded ?? Boolean(value.completed),
  }
}

export default function App() {
  const [ready, setReady] = useState(false), [entered, setEntered] = useState(false), [view, setView] = useState<View>("today")
  const [tasks, setTasks] = useState<Task[]>([]), [jars, setJars] = useState<Jar[]>([]), [settings, setSettings] = useState<AppSettings>(base)
  const [input, setInput] = useState(""), [weekInput, setWeekInput] = useState(""), [weekStart, setWeekStart] = useState(toDateKey(getMonday()))
  const [drafts, setDrafts] = useState<GeneratedTask[]>([]), [mode, setMode] = useState<PlanMode>("daily"), [planWarnings, setPlanWarnings] = useState<string[]>([])
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(""), [manualName, setManualName] = useState(""), [voiceUsed, setVoiceUsed] = useState(false)
  const acceptingRef = useRef(false)
  const repository = useMemo(() => new LocalStorageTaskJarRepository({ defaults: base, mergeSettings, migrateTask, freshJar }), [])
  const today = toDateKey(new Date()), currentJar = jars.find((jar) => !jar.completed) || jars.at(-1), weekMap = useMemo(() => getWeekDateMap(weekStart), [weekStart])

  useEffect(() => {
    try {
      setEntered(localStorage.getItem("taskjar_entered") === "1")
      const state = repository.load()
      setSettings({ ...state.settings, preferences: { ...state.settings.preferences, timezone: state.settings.preferences.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata" } })
      setTasks(state.tasks); setJars(state.jars)
    } catch { setJars([freshJar(base.jarTarget)]); setNotice("Local data could not be read, so TaskJar opened a clean workspace.") }
    finally { setReady(true) }
  }, [repository])
  useEffect(() => { if (ready) repository.save({ tasks, jars, settings }) }, [tasks, jars, settings, ready, repository])

  const todayTasks = tasks.filter((task) => task.scheduledFor ? task.scheduledFor <= today : toDateKey(new Date(task.createdAt)) === today)
    .sort((a, b) => Number(a.completed) - Number(b.completed) || (a.suggestedStartTime || "99:99").localeCompare(b.suggestedStartTime || "99:99"))

  async function plan(kind: PlanMode) {
    const text = kind === "daily" ? input : weekInput
    if (!text.trim()) return
    setBusy(true); setMode(kind); setPlanWarnings([])
    try {
      const installed = (await getInstalledModelIds()).includes(settings.localAI.selectedModelId)
      let generated: GeneratedTask[]
      if (installed && hasWebGpu()) {
        const prompt = kind === "daily" ? buildDailyPrompt(text, today, settings) : buildWeeklyPrompt(text, weekStart)
        const output = extractJsonArray((await generateOnDevice(settings.localAI.selectedModelId, prompt)).text)
        generated = kind === "daily" ? normalizeGeneratedDaily(output, today) : normalizeGeneratedWeekly(output, weekStart)
        setNotice("Generated privately with your installed on-device model.")
      } else {
        generated = kind === "daily" ? fallbackDailyPlan(text, today) : fallbackWeeklyPlan(text, weekStart)
        setNotice("Used the offline rules planner. Install a local model for richer interpretation.")
      }
      const result = finalisePlan(generated, settings); setDrafts(result.tasks); setPlanWarnings(result.planningWarnings)
    } catch (error) {
      const result = finalisePlan(kind === "daily" ? fallbackDailyPlan(text, today) : fallbackWeeklyPlan(text, weekStart), settings)
      setDrafts(result.tasks); setPlanWarnings(result.planningWarnings); setNotice(`${error instanceof Error ? error.message : "Local AI failed."} Your transcript was preserved and the offline planner was used.`)
    } finally { setBusy(false) }
  }

  function regenerateTask(index: number) {
    const current = drafts[index]
    if (!current) return
    const next = finalisePlan(fallbackDailyPlan(current.sourceExcerpt || `${current.name}. ${current.description}`, current.scheduledFor || today), settings).tasks[0]
    if (next) setDrafts((items) => items.map((item, position) => position === index ? { ...next, selected: item.selected, scheduledFor: item.scheduledFor || next.scheduledFor } : item))
  }

  function addDrafts() {
    if (acceptingRef.current) return
    acceptingRef.current = true
    const source: TaskSource = mode === "weekly" ? "weekly-ai" : voiceUsed ? "voice-ai" : "daily-ai"
    const selected = drafts.filter((draft) => draft.selected !== false)
    setTasks((old) => [...selected.map((draft) => migrateTask({
      ...draft, id: uid(), createdAt: Date.now(), scheduledFor: draft.scheduledFor || today, source, originalPrompt: undefined,
      sourceTranscript: draft.sourceExcerpt, aiGenerated: true, priorityEmoji: settings.emojis.priority[draft.priority], difficultyEmoji: settings.emojis.difficulty[draft.difficulty],
      xpValue: calculateTaskXP(draft), completed: false, xpAwarded: false,
    })), ...old])
    setDrafts([]); setPlanWarnings([]); setNotice(`${selected.length} reviewed task${selected.length === 1 ? "" : "s"} added.`)
    window.setTimeout(() => { acceptingRef.current = false }, 400)
  }

  function awardXP(task: Task) {
    const active = jars.find((jar) => !jar.completed) || freshJar(settings.jarTarget)
    const nextXP = active.currentXP + task.xpValue
    if (nextXP >= active.targetXP) {
      const completed = { ...active, currentXP: active.targetXP, completed: true, completedAt: Date.now(), tasks: [...active.tasks, task.id] }
      const next = { ...freshJar(settings.jarTarget), currentXP: nextXP - active.targetXP }
      setJars((items) => [...items.filter((jar) => jar.id !== active.id), completed, next])
    } else setJars((items) => items.some((jar) => jar.id === active.id) ? items.map((jar) => jar.id === active.id ? { ...jar, currentXP: nextXP, tasks: [...jar.tasks, task.id] } : jar) : [{ ...active, currentXP: nextXP, tasks: [task.id] }])
  }

  function toggleTask(task: Task) {
    const completing = !task.completed
    if (completing && (task.subtasks || []).some((subtask) => !subtask.completed) && !confirm("Some subtasks are unfinished. Complete the parent task anyway?")) return
    setTasks((items) => items.map((item) => item.id === task.id ? { ...item, completed: completing, completedAt: completing ? Date.now() : undefined, xpAwarded: item.xpAwarded || completing } : item))
    if (completing && !task.xpAwarded) awardXP(task)
  }
  function toggleSubtask(taskId: string, subtaskId: string) {
    setTasks((items) => items.map((task) => task.id !== taskId ? task : { ...task, subtasks: (task.subtasks || []).map((subtask) => subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed, completedAt: !subtask.completed ? Date.now() : undefined } : subtask) }))
  }
  function addManualTask() {
    if (!manualName.trim()) return
    const difficulty: Difficulty = "light", priority: Priority = "optional"
    setTasks((items) => [migrateTask({ id: uid(), name: manualName.trim(), description: "", priority, difficulty, priorityEmoji: settings.emojis.priority[priority], difficultyEmoji: settings.emojis.difficulty[difficulty], xpValue: calculateTaskXP({ estimatedMinutes: 15, difficulty, priority }), completed: false, createdAt: Date.now(), scheduledFor: today, source: "manual", estimatedMinutes: 15, energy: "low", xpAwarded: false }), ...items])
    setManualName("")
  }
  function recordActual(taskId: string) {
    const value = prompt("Actual active minutes spent?")
    const minutes = Number(value)
    if (Number.isFinite(minutes) && minutes > 0) setTasks((items) => items.map((task) => task.id === taskId ? { ...task, actualMinutes: Math.min(1440, Math.round(minutes)) } : task))
  }

  if (!ready) return <main className="loading"><Loader2 className="spin"/></main>
  if (!entered) return <main className="landing"><div><Sparkles size={42}/><p className="eyebrow">TASKJAR LOCAL</p><h1>Plan your work without an account.</h1><p>Speak or type your day, review every suggestion, keep everything in this browser, and export your execution journey as Markdown.</p><button onClick={() => { localStorage.setItem("taskjar_entered", "1"); setEntered(true) }}>Open local workspace <Home size={17}/></button></div></main>

  const nav: Array<[View, ReactNode, string]> = [["today", <Home key="home"/>, "Today"], ["week", <CalendarDays key="week"/>, "Week"], ["journey", <Trophy key="journey"/>, "Journey"], ["settings", <Settings key="settings"/>, "Settings"]]
  return <main className="app">
    <aside><h2>TaskJar</h2><small>Voice-first · local-first</small>{nav.map(([value, icon, label]) => <button className={view === value ? "active" : ""} key={value} onClick={() => setView(value)}>{icon}{label}</button>)}<div className="jar"><small>Current jar</small><progress value={currentJar?.currentXP || 0} max={currentJar?.targetXP || 100}/><span>{currentJar?.currentXP || 0}/{currentJar?.targetXP || 100} XP</span></div></aside>
    <section className="content"><header><p className="eyebrow">STORED LOCALLY</p><h1>{view === "week" ? "Weekly planner" : view}</h1></header>{notice && <p className="notice">{notice}</p>}
      {view === "today" && <><VoiceCaptureCard transcript={input} onTranscriptChange={setInput} onMakePlan={() => plan("daily")} busy={busy} onVoiceUsed={() => setVoiceUsed(true)} languageTag={settings.voice.languageTag} hasAcknowledgedDisclosure={settings.voice.hasAcknowledgedDisclosure} onAcknowledgeDisclosure={() => setSettings((current) => ({ ...current, voice: { ...current.voice, hasAcknowledgedDisclosure: true } }))}/><section className="card manual-card"><div><h3>Add manually</h3><p className="muted compact">No AI required.</p></div><div className="manual-row"><input value={manualName} onChange={(event) => setManualName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addManualTask() }} placeholder="One clear next action"/><button disabled={!manualName.trim()} onClick={addManualTask}><Plus/> Add</button></div></section><div className="section-title"><div><h2>Due today and carry-over</h2><p className="muted compact">Past unfinished tasks remain visible.</p></div><span>{todayTasks.filter((task) => !task.completed).length} open</span></div><div className="list">{todayTasks.length ? todayTasks.map((task) => <TaskRow key={task.id} task={task} toggle={() => toggleTask(task)} remove={() => setTasks((items) => items.filter((item) => item.id !== task.id))} toggleSubtask={(id) => toggleSubtask(task.id, id)} recordActual={() => recordActual(task.id)}/>) : <p className="empty">Nothing planned yet. Speak naturally or add one task manually.</p>}</div></>}
      {view === "week" && <><section className="card"><h2>Organise a full week</h2><label>Week beginning<input type="date" value={weekStart} onChange={(event) => setWeekStart(toDateKey(getMonday(parseISO(event.target.value))))}/></label><textarea value={weekInput} onChange={(event) => setWeekInput(event.target.value)} placeholder="Monday finish landing page; Friday submit report…"/><button disabled={busy || !weekInput.trim()} onClick={() => plan("weekly")}>{busy ? <Loader2 className="spin"/> : <CalendarDays/>} Organise week</button></section><div className="week">{DAYS.map((day) => <section className="card" key={day}><h3>{day}</h3><small>{weekMap[day]}</small>{tasks.filter((task) => task.scheduledFor === weekMap[day]).map((task) => <p key={task.id}>{task.completed ? "✓ " : "• "}{task.suggestedStartTime ? `${task.suggestedStartTime} · ` : ""}{task.name}</p>)}</section>)}</div></>}
      {view === "journey" && <><div className="stats"><section className="card"><b>{tasks.length}</b><small>Tasks</small></section><section className="card"><b>{tasks.filter((task) => task.completed).length}</b><small>Completed</small></section><section className="card"><b>{jars.filter((jar) => jar.completed).length}</b><small>Jars filled</small></section></div><section className="card"><h2>AI-ready Markdown</h2><p className="muted">Includes timing, estimates, subtasks, actual time and milestones—without full voice transcripts.</p><button onClick={() => downloadJourneyMarkdown(tasks, jars, settings)}><Download/> Export journey</button><details><summary>Preview</summary><pre>{buildJourneyMarkdown(tasks, jars, settings)}</pre></details></section></>}
      {view === "settings" && <><ModelManager selected={settings.localAI.selectedModelId} onSelect={(id) => setSettings((current) => ({ ...current, localAI: { selectedModelId: id } }))} onNotice={setNotice}/><section className="card settings-grid"><h2>Planning preferences</h2><label>Name<input value={settings.studentName} onChange={(event) => setSettings((current) => ({ ...current, studentName: event.target.value }))}/></label><label>Wake time<input type="time" value={settings.preferences.wakeTime} onChange={(event) => setSettings((current) => ({ ...current, preferences: { ...current.preferences, wakeTime: event.target.value } }))}/></label><label>Sleep time<input type="time" value={settings.preferences.sleepTime} onChange={(event) => setSettings((current) => ({ ...current, preferences: { ...current.preferences, sleepTime: event.target.value } }))}/></label><label>Focus period<select value={settings.preferences.preferredFocusPeriod} onChange={(event) => setSettings((current) => ({ ...current, preferences: { ...current.preferences, preferredFocusPeriod: event.target.value as AppSettings["preferences"]["preferredFocusPeriod"] } }))}><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></label><label>Max planned minutes<input type="number" min="60" max="960" step="30" value={settings.preferences.maxPlannedMinutesPerDay} onChange={(event) => setSettings((current) => ({ ...current, preferences: { ...current.preferences, maxPlannedMinutesPerDay: Number(event.target.value) } }))}/></label><label>Timezone<input value={settings.preferences.timezone} onChange={(event) => setSettings((current) => ({ ...current, preferences: { ...current.preferences, timezone: event.target.value } }))}/></label><label>Voice language<select value={settings.voice.languageTag} onChange={(event) => setSettings((current) => ({ ...current, voice: { ...current.voice, languageTag: event.target.value } }))}><option value="en">English (Whisper Tiny English)</option></select></label></section><section className="card"><h2>Local data</h2><p className="muted">This removes task history and jar progress only from this browser.</p><button className="danger" onClick={() => { if (confirm("Delete all local task history?")) { setTasks([]); setJars([freshJar(settings.jarTarget)]) } }}><Trash2/> Clear history</button></section></>}
    </section>
    <nav className="mobile">{nav.map(([value, icon, label]) => <button className={view === value ? "active" : ""} key={value} onClick={() => setView(value)}>{icon}<small>{label}</small></button>)}</nav>
    {drafts.length > 0 && <PlanReviewModal drafts={drafts} onChange={setDrafts} warnings={planWarnings} transcript={mode === "daily" ? input : weekInput} onAccept={addDrafts} onRegenerate={() => plan(mode)} onRegenerateTask={regenerateTask} onClose={() => setDrafts([])}/>} 
  </main>
}

function TaskRow({ task, toggle, remove, toggleSubtask, recordActual }: { task: Task; toggle: () => void; remove: () => void; toggleSubtask: (id: string) => void; recordActual: () => void }) {
  const [expanded, setExpanded] = useState(false), subtasks = task.subtasks || [], completed = subtasks.filter((item) => item.completed).length
  return <article className="task"><button className="icon" onClick={toggle} aria-label={task.completed ? `Reopen ${task.name}` : `Complete ${task.name}`}>{task.completed ? <Check/> : <Circle/>}</button><div><div className="task-title-row"><b className={task.completed ? "done" : ""}>{task.name}</b>{task.aiGenerated && <span className="ai-label">AI suggestion</span>}</div>{task.description && <p>{task.description}</p>}<div className="task-meta"><span>{task.priorityEmoji} {task.priority}</span><span>{task.difficultyEmoji} {task.difficulty}</span>{task.estimatedMinutes && <span><Clock3/> {task.estimatedMinutes} min</span>}{task.energy && <span><Gauge/> {task.energy} energy</span>}{task.suggestedStartTime && <span>{task.suggestedStartTime}</span>}</div>{task.timingReason && <small className="timing-reason">{task.timingConstraintSource}: {task.timingReason}</small>}{subtasks.length > 0 && <div className="subtasks"><button className="subtask-toggle" onClick={() => setExpanded((value) => !value)}>{expanded ? <ChevronDown/> : <ChevronRight/>}{completed}/{subtasks.length} subtasks</button>{expanded && <div className="subtask-list">{subtasks.map((subtask) => <label key={subtask.id}><input type="checkbox" checked={subtask.completed} onChange={() => toggleSubtask(subtask.id)}/><span className={subtask.completed ? "done" : ""}>{subtask.title}</span>{subtask.estimatedMinutes && <small>{subtask.estimatedMinutes}m</small>}</label>)}</div>}</div>}{task.completed && <button className="actual-time" onClick={recordActual}>{task.actualMinutes ? `Actual time: ${task.actualMinutes} min` : "Record actual time"}</button>}</div><button className="icon danger" onClick={remove} aria-label={`Delete ${task.name}`}><Trash2/></button></article>
}
