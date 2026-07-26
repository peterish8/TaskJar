import { addDays, format, isValid, parse, parseISO, startOfWeek } from "date-fns"
import type { Difficulty, GeneratedTask, Priority } from "../types"

export const DATE_KEY_FORMAT = "yyyy-MM-dd"
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

export function toDateKey(date: Date): string {
  return format(date, DATE_KEY_FORMAT)
}

export function getMonday(date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

export function getWeekDateMap(weekStartKey: string): Record<string, string> {
  const parsed = parseISO(weekStartKey)
  const start = isValid(parsed) ? parsed : getMonday()
  return Object.fromEntries(DAYS.map((day, index) => [day, toDateKey(addDays(start, index))]))
}

export function buildDailyPrompt(input: string, todayKey: string): string {
  return `You are TaskJar, a private on-device task planner. Convert the user's brain dump into a small, realistic list of actionable tasks for ${todayKey}.

Return ONLY a valid JSON array. Do not use markdown fences or commentary.
Each object must use this exact shape:
{"name":"short action title","description":"one useful sentence","priority":"low|medium|high","difficulty":"easy|moderate|hard"}

Rules:
- Prefer 3 to 8 tasks.
- Start task names with a verb.
- Split large work into concrete steps.
- Do not invent appointments, deadlines, people, or facts.
- Keep descriptions concise.

User brain dump:
${input}`
}

export function buildWeeklyPrompt(input: string, weekStartKey: string): string {
  const map = getWeekDateMap(weekStartKey)
  const dateGuide = DAYS.map((day) => `${day}: ${map[day]}`).join("\n")

  return `You are TaskJar, a private on-device weekly planner. Convert the user's weekly brain dump into realistic tasks assigned to this exact week:
${dateGuide}

Return ONLY a valid JSON array. Do not use markdown fences or commentary.
Each object must use this exact shape:
{"date":"yyyy-MM-dd","name":"short action title","description":"one useful sentence","priority":"low|medium|high","difficulty":"easy|moderate|hard"}

Rules:
- Use only dates listed above.
- Keep tasks on the day explicitly mentioned by the user.
- For unassigned tasks, place them on the earliest sensible day with a balanced workload.
- Split large work into concrete steps.
- Do not invent appointments, deadlines, people, or facts.

Weekly brain dump:
${input}`
}

export function extractJsonArray(text: string): unknown[] {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim()
  const start = cleaned.indexOf("[")
  const end = cleaned.lastIndexOf("]")
  if (start === -1 || end === -1 || end <= start) throw new Error("The local model did not return a JSON task list.")
  const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1))
  if (!Array.isArray(parsed)) throw new Error("The local model response was not an array.")
  return parsed
}

export function normalizePriority(value: unknown): Priority {
  const text = String(value ?? "").toLowerCase()
  if (["high", "urgent", "critical", "p1"].some((token) => text.includes(token))) return "urgent"
  if (["medium", "scheduled", "normal", "p2"].some((token) => text.includes(token))) return "scheduled"
  return "optional"
}

export function normalizeDifficulty(value: unknown): Difficulty {
  const text = String(value ?? "").toLowerCase()
  if (["hard", "challenging", "heavy", "deep"].some((token) => text.includes(token))) return "challenging"
  if (["moderate", "standard", "medium", "normal"].some((token) => text.includes(token))) return "standard"
  return "light"
}

function titleCaseAction(text: string): string {
  const cleaned = text.replace(/^[-*•\d.)\s]+/, "").replace(/\s+/g, " ").trim()
  if (!cleaned) return "Review next action"
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function inferPriority(text: string): Priority {
  const value = text.toLowerCase()
  if (/urgent|asap|deadline|today|must|critical|important/.test(value)) return "urgent"
  if (/meeting|class|appointment|submit|schedule|tomorrow|exam/.test(value)) return "scheduled"
  return "optional"
}

function inferDifficulty(text: string): Difficulty {
  const value = text.toLowerCase()
  if (/build|implement|project|study|prepare|research|assignment|debug|design/.test(value)) return "challenging"
  if (/write|review|practice|organise|organize|plan|complete/.test(value)) return "standard"
  return "light"
}

function splitBrainDump(input: string): string[] {
  const lineParts = input.split(/\n|;|(?:\s+then\s+)|(?:\s+and then\s+)/gi).flatMap((part) => part.split(/(?<=[.!?])\s+(?=[A-Z0-9])/)).map((part) => part.trim()).filter(Boolean)
  if (lineParts.length > 1) return lineParts.slice(0, 12)
  const commaParts = input.split(/,(?=\s*(?:then\s+)?[a-zA-Z])/).map((part) => part.trim()).filter(Boolean)
  return (commaParts.length > 1 ? commaParts : [input.trim()]).slice(0, 12)
}

export function fallbackDailyPlan(input: string): GeneratedTask[] {
  return splitBrainDump(input).map((part) => ({
    name: titleCaseAction(part).slice(0, 90),
    description: `Complete this clearly defined step: ${part.replace(/^[-*•\d.)\s]+/, "").trim()}`.slice(0, 220),
    priority: inferPriority(part),
    difficulty: inferDifficulty(part),
  }))
}

function parseDateMention(text: string): string | undefined {
  const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
  if (isoMatch && isValid(parseISO(isoMatch[1]))) return isoMatch[1]
  const commonMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}))?\b/)
  if (commonMatch) {
    const year = commonMatch[3] ? Number(commonMatch[3]) : new Date().getFullYear()
    const parsed = parse(`${commonMatch[1]}/${commonMatch[2]}/${year}`, "d/M/yyyy", new Date())
    if (isValid(parsed)) return toDateKey(parsed)
  }
  return undefined
}

export function fallbackWeeklyPlan(input: string, weekStartKey: string): GeneratedTask[] {
  const dateMap = getWeekDateMap(weekStartKey)
  const validDates = new Set(Object.values(dateMap))
  const pieces = splitBrainDump(input)
  let rollingIndex = 0
  return pieces.map((part) => {
    const lower = part.toLowerCase()
    const namedDay = DAYS.find((day) => lower.includes(day.toLowerCase()))
    const mentionedDate = parseDateMention(part)
    const scheduledFor = (mentionedDate && validDates.has(mentionedDate) ? mentionedDate : undefined) ?? (namedDay ? dateMap[namedDay] : dateMap[DAYS[Math.min(rollingIndex++, DAYS.length - 1)]])
    const cleaned = part.replace(new RegExp(`\\b(${DAYS.join("|")})\\b[:,-]?`, "i"), "").replace(/\b20\d{2}-\d{2}-\d{2}\b/, "").trim()
    return { name: titleCaseAction(cleaned || part).slice(0, 90), description: `Complete this planned step: ${(cleaned || part).trim()}`.slice(0, 220), priority: inferPriority(part), difficulty: inferDifficulty(part), scheduledFor }
  })
}

export function normalizeGeneratedDaily(items: unknown[]): GeneratedTask[] {
  return items.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")).map((item) => ({ name: titleCaseAction(String(item.name ?? item.title ?? "Task")).slice(0, 90), description: String(item.description ?? item.details ?? "").trim().slice(0, 240), priority: normalizePriority(item.priority), difficulty: normalizeDifficulty(item.difficulty) })).filter((item) => item.name.length > 0).slice(0, 12)
}

export function normalizeGeneratedWeekly(items: unknown[], weekStartKey: string): GeneratedTask[] {
  const dateMap = getWeekDateMap(weekStartKey)
  const validDates = new Set(Object.values(dateMap))
  let fallbackIndex = 0
  return items.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")).map((item) => {
    const rawDate = String(item.date ?? item.scheduledFor ?? "")
    const rawDay = String(item.day ?? "")
    const matchedDay = DAYS.find((day) => day.toLowerCase() === rawDay.toLowerCase())
    const scheduledFor = validDates.has(rawDate) ? rawDate : matchedDay ? dateMap[matchedDay] : dateMap[DAYS[Math.min(fallbackIndex++, DAYS.length - 1)]]
    return { name: titleCaseAction(String(item.name ?? item.title ?? "Task")).slice(0, 90), description: String(item.description ?? item.details ?? "").trim().slice(0, 240), priority: normalizePriority(item.priority), difficulty: normalizeDifficulty(item.difficulty), scheduledFor }
  }).filter((item) => item.name.length > 0).slice(0, 24)
}
