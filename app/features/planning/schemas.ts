import { z } from "zod"

export const planRequestSchema = z.object({
  transcript: z.string().trim().min(1).max(12_000),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1).max(100),
  now: z.string().datetime().or(z.string().min(1)),
  preferences: z.object({
    wakeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    sleepTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    preferredFocusPeriods: z.array(z.enum(["morning", "afternoon", "evening"])).max(3).optional(),
    defaultBreakMinutes: z.number().int().min(0).max(60).optional(),
    maxPlannedMinutesPerDay: z.number().int().min(60).max(960).optional(),
  }).optional(),
})

export const plannedSubtaskSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(140),
  estimatedMinutes: z.number().int().min(1).max(240).optional(),
  completed: z.boolean().default(false),
  completedAt: z.number().optional(),
})

export const plannedTaskSchema = z.object({
  clientId: z.string().min(1).max(100).optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).default(""),
  priority: z.enum(["urgent", "scheduled", "optional"]),
  difficulty: z.enum(["light", "standard", "challenging"]),
  energy: z.enum(["low", "medium", "high"]).default("medium"),
  estimatedMinutes: z.number().int().min(5).max(480).default(30),
  scheduledFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  suggestedStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  preferredDaypart: z.enum(["morning", "afternoon", "evening", "night", "anytime"]).default("anytime"),
  timingConstraintSource: z.enum(["explicit", "inferred", "none"]).default("none"),
  timingReason: z.string().max(300).default("No exact time was given; this remains flexible."),
  planningConfidence: z.number().min(0).max(1).default(0.65),
  subtasks: z.array(plannedSubtaskSchema).max(5).default([]),
  sourceExcerpt: z.string().max(500).optional(),
  warnings: z.array(z.string().max(240)).max(8).default([]),
  selected: z.boolean().default(true),
})

export const planResultSchema = z.object({
  tasks: z.array(plannedTaskSchema).max(30),
  totalEstimatedMinutes: z.number().int().min(0).max(14_400),
  planningWarnings: z.array(z.string().max(300)).max(20).default([]),
  unparsedNotes: z.array(z.string().max(500)).max(20).default([]),
})
