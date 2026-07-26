# Voice Planning Data Model

## Goals

- Preserve backward compatibility with current Task and Jar records.
- Separate persisted tasks from temporary AI proposals.
- Record whether timing/duration came from the user or TaskJar.
- Support subtasks without multiplying XP.
- Make migrations explicit and testable.

## Persisted state envelope

```ts
interface PersistedTaskJarStateV2 {
  schemaVersion: 2;
  tasks: TaskV2[];
  jars: JarV2[];
  settings: AppSettingsV2;
  metadata: {
    migratedAt?: number;
    lastSavedAt: number;
  };
}
```

Store the state in one versioned envelope when practical. During transition, adapters may continue reading legacy keys and migrate them into V2.

## Task

```ts
type TaskPriority = "urgent" | "scheduled" | "optional";
type TaskDifficulty = "light" | "standard" | "challenging";
type EnergyLevel = "low" | "medium" | "high";
type EstimateConfidence = "low" | "medium" | "high";

type ValueSource =
  | "explicit_user"
  | "ai_inferred"
  | "scheduler_inferred"
  | "user_edited"
  | "legacy";

interface TaskV2 {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  energy: EnergyLevel;

  duration: {
    estimatedMinutes: number;
    rangeMinutes?: { min: number; max: number };
    confidence: EstimateConfidence;
    source: ValueSource;
    rationale?: string;
  };

  schedule: TaskSchedule;
  constraints: TaskConstraint[];
  subtasks: Subtask[];

  xpValue: number;
  progress: number; // 0..1, derived or normalized before persistence
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;

  origin: {
    type: "manual" | "typed_ai" | "voice_ai" | "weekly_ai" | "legacy";
    planningSessionId?: string;
    transcriptExcerpt?: string; // optional, short, user-visible; never required
  };
}
```

Compatibility note: current `name` maps to `title`. UI compatibility selectors may expose `name` temporarily, but new domain code should use `title` consistently.

## Subtask

```ts
interface Subtask {
  id: string;
  title: string;
  description?: string;
  order: number;
  estimatedMinutes?: number;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}
```

Subtasks do not have independent XP values. Parent progress may be calculated as completed subtasks divided by total subtasks, unless the user manually completes the parent.

## Scheduling

```ts
type ScheduleSource =
  | "explicit_exact"
  | "explicit_window"
  | "explicit_daypart"
  | "inferred_energy_fit"
  | "inferred_deadline_fit"
  | "user_edited"
  | "unscheduled"
  | "legacy";

interface TaskSchedule {
  date?: string; // YYYY-MM-DD in user's planning timezone
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  window?: {
    start: string;
    end: string;
  };
  timezone: string;
  source: ScheduleSource;
  lockedByUser: boolean;
}
```

Dates are stored as calendar dates plus timezone, not as an ambiguous `Date.toDateString()` value. Conversion to timestamps happens at display/integration boundaries.

## Constraints

```ts
type TaskConstraint =
  | {
      type: "deadline";
      date: string;
      time?: string;
      timezone: string;
      source: ValueSource;
    }
  | {
      type: "daypart";
      value: "morning" | "afternoon" | "evening" | "night";
      source: ValueSource;
    }
  | {
      type: "not_before" | "not_after";
      date?: string;
      time?: string;
      source: ValueSource;
    }
  | {
      type: "dependency";
      taskId?: string;
      temporaryProposalId?: string;
      relationship: "after" | "before";
      source: ValueSource;
    }
  | {
      type: "maximum_duration";
      minutes: number;
      source: ValueSource;
    };
```

## Temporary planning entities

AI output must never be cast directly to `TaskV2`.

```ts
interface PlanningSession {
  id: string;
  createdAt: number;
  locale: string;
  timezone: string;
  planningDate: string;
  transcript: {
    text: string;
    revision: number;
    source: "voice" | "typed";
  };
  status:
    | "capturing"
    | "transcript_review"
    | "compiling"
    | "plan_review"
    | "accepted"
    | "discarded"
    | "error";
}

interface TaskProposal {
  proposalId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  energy: EnergyLevel;
  duration: TaskV2["duration"];
  schedule: TaskSchedule;
  constraints: TaskConstraint[];
  subtasks: Array<Omit<Subtask, "id" | "createdAt" | "updatedAt">>;
  warnings: PlanWarning[];
  included: boolean;
}
```

Only an explicit acceptance function converts proposals into persisted tasks, assigns stable IDs, calculates XP, and resolves proposal dependency IDs.

## Warnings and assumptions

```ts
type PlanWarningCode =
  | "OVERLOADED_DAY"
  | "CONFLICTING_TIME_CONSTRAINTS"
  | "DEADLINE_AT_RISK"
  | "LOW_ESTIMATE_CONFIDENCE"
  | "MISSING_REQUIRED_CONTEXT"
  | "UNSCHEDULED_TASK";

interface PlanWarning {
  code: PlanWarningCode;
  message: string;
  proposalIds?: string[];
  severity: "info" | "warning" | "blocking";
}

interface PlanAssumption {
  id: string;
  message: string;
  proposalId?: string;
  editableField?: string;
}
```

## Settings additions

```ts
interface PlanningPreferences {
  timezone: string;
  locale: string;
  dayStart: string;
  dayEnd: string;
  preferredFocusWindow?: { start: string; end: string };
  maximumPlannedMinutesPerDay: number;
  transitionBufferMinutes: number;
  dayparts: {
    morning: { start: string; end: string };
    afternoon: { start: string; end: string };
    evening: { start: string; end: string };
    night: { start: string; end: string };
  };
}

interface VoicePreferences {
  enabled: boolean;
  modelId?: string;
  languageTag?: string;
  hasAcknowledgedTranscriptDisclosure: boolean;
}
```

Add these under `AppSettingsV2` while retaining existing XP, emoji, sound, and theme settings.

## Jar compatibility

```ts
interface JarV2 {
  id: string;
  currentXP: number;
  targetXP: number;
  completed: boolean;
  completedAt?: number;
  taskIds: string[];
  name?: string;
  createdAt: number;
}
```

Legacy `tasks` maps to `taskIds`.

## XP policy input

```ts
interface XPPolicyInput {
  estimatedMinutes: number;
  difficulty: TaskDifficulty;
  priority: TaskPriority;
}
```

The AI does not return trusted XP. A deterministic domain function computes it and clamps the output.

Example initial policy for testing, subject to product tuning:

```ts
function calculateTaskXP(input: XPPolicyInput): number {
  const durationBase =
    input.estimatedMinutes <= 15 ? 5 :
    input.estimatedMinutes <= 30 ? 8 :
    input.estimatedMinutes <= 60 ? 12 :
    input.estimatedMinutes <= 120 ? 18 : 24;

  const difficultyMultiplier = {
    light: 1,
    standard: 1.25,
    challenging: 1.5,
  }[input.difficulty];

  const urgencyBonus = input.priority === "urgent" ? 2 : 0;
  return Math.max(5, Math.min(40, Math.round(durationBase * difficultyMultiplier + urgencyBonus)));
}
```

Do not finalize balancing without observing real task distributions.

## Migration from current repository

Current data characteristics:

- separate localStorage keys for tasks, jars, and settings;
- `name` rather than `title`;
- optional `scheduledFor` as an implementation-dependent date string;
- no subtasks, duration, energy, constraints, or update timestamp;
- XP already stored per task.

Migration rules:

1. Read existing keys defensively with schema validation.
2. For each legacy task:
   - map `name -> title`;
   - retain description, priority, difficulty, XP, completion timestamps;
   - set energy from difficulty as a migration fallback, marked legacy;
   - assign a conservative duration bucket from difficulty, marked legacy;
   - parse `scheduledFor` only when safe; otherwise leave unscheduled;
   - set empty constraints/subtasks;
   - set origin type `legacy`;
   - set updatedAt to createdAt or migration time.
3. Map jar `tasks -> taskIds`; retain XP/completion state.
4. Merge planning and voice defaults into settings.
5. Save V2 only after the complete migration succeeds.
6. Keep a backup of raw legacy values until at least one successful V2 save.
7. Migration must be idempotent.

## Validation rules

- Titles: trimmed, 1–120 characters.
- Descriptions: maximum reasonable application limit.
- Duration: positive integer, clamped to product maximum.
- Range: min <= estimated <= max.
- Progress: 0..1.
- Subtask order: unique and normalized.
- Exact schedule: end must be after start.
- Deadlines and scheduled dates use ISO date strings.
- All timezone values must be recognized IANA timezone identifiers where supported.
- Unknown AI enum values cause validation failure or explicit safe normalization; never use unchecked `as any`.
