# Voice-First AI Daily Planner

**Status:** Planned  
**Priority:** P0 — next major TaskJar feature  
**Primary surface:** `app/components/todo-page.tsx`  
**Speech engine:** sherpa-onnx WASM, running in the browser  
**Planning engine:** server-side structured AI task generation

## 1. Product intent

TaskJar should let a user speak naturally about everything they need to do, while live subtitles appear continuously. When they finish, TaskJar converts the transcript into a clean, editable daily plan containing clear tasks, useful subtasks, realistic duration estimates, suggested start times, priority, difficulty, and XP.

The user should not have to think like a task-management app. They may speak in an unstructured way:

> I need to finish my DBMS assignment, call Amma sometime in the evening, revise React, buy shampoo, and maybe work on my portfolio if I have energy.

TaskJar should turn this into an organised proposal without losing the user's intent:

- Finish DBMS assignment — high priority — 75 minutes
  - Review the assignment requirements
  - Complete remaining questions
  - Verify answers and submit
- Call Amma — scheduled — suggested 7:30 PM — 15 minutes
- Revise React — scheduled — suggested 5:00 PM — 45 minutes
  - Review hooks
  - Build one small example
- Buy shampoo — optional — 15 minutes
- Portfolio work — optional and energy-dependent — 30 minutes

Nothing is added permanently until the user reviews and confirms the generated plan.

## 2. Goals

1. Make voice the fastest and most natural way to capture a day's responsibilities.
2. Show continuous, low-latency live subtitles while recording.
3. Convert messy speech into concise, actionable tasks.
4. Generate only useful subtasks that reduce ambiguity.
5. Recommend realistic durations and schedules while respecting explicit constraints.
6. Preserve the existing TaskJar jar, XP, completion, history, and task-review concepts.
7. Keep raw audio on-device by default.
8. Support correction, deletion, regeneration, and partial acceptance before saving.

## 3. Non-goals for the first release

- Fully automatic calendar booking.
- Background microphone listening.
- Always-on wake words.
- Medical or psychological inference from voice.
- Emotion detection from audio.
- Sending raw microphone audio to the task-generation model.
- Multi-user collaboration.
- Replacing user judgement with an authoritative schedule.

## 4. Current repository baseline

TaskJar currently:

- uses Next.js 15, React 19, TypeScript, Tailwind, and Radix-based UI components;
- accepts typed natural-language input in `todo-page.tsx`;
- calls `/api/generate-tasks`;
- maps AI priority values into `optional | scheduled | urgent`;
- maps AI difficulty values into `light | standard | challenging`;
- assigns XP based on difficulty;
- shows a generated-task review dialog;
- stores tasks in client state with `createdAt`, optional `scheduledFor`, and completion metadata;
- fills jars from completed-task XP.

The new feature should replace the typed-only capture card with a voice-first capture experience while retaining typed editing and fallback.

## 5. Core user flow

### 5.1 Start capture

1. User opens Today's Tasks.
2. The primary card shows a prominent microphone action: **Speak my day**.
3. On first use, the app explains that speech is transcribed locally and requests microphone permission only after the user acts.
4. sherpa-onnx WASM model assets initialise.
5. Recording begins only after the recogniser is ready.

### 5.2 Speak naturally

1. A recording state shows elapsed time, microphone status, and a clear stop control.
2. Interim transcript text appears continuously as live subtitles.
3. Stable/final recognised segments are visually distinguished from the current partial segment.
4. The transcript area auto-scrolls but remains manually scrollable.
5. The user may pause, resume, stop, or discard.
6. The UI should not create tasks while speech is still being captured.

### 5.3 Review transcript

1. After stopping, the complete transcript becomes editable.
2. The user can correct names, dates, and recognition mistakes.
3. The user selects **Make my plan**.
4. Only the edited transcript and relevant user planning preferences are sent to the server.

### 5.4 Generate structured plan

1. The server validates input length and invokes the planning model with a strict structured-output schema.
2. The model identifies individual tasks, constraints, dependencies, subtasks, effort, energy demand, duration, timing, and uncertainty.
3. The server validates the model output with Zod.
4. Invalid output is repaired once or rejected with a recoverable error.
5. The app opens a review screen containing the proposed plan.

### 5.5 Review and accept

For every proposed task, the user can:

- edit title and description;
- change priority or difficulty;
- change estimated duration;
- change or remove the suggested start time;
- expand, edit, add, reorder, or remove subtasks;
- accept or exclude the task;
- see why a time was suggested;
- see which phrases were interpreted as explicit constraints.

The user may accept all, accept selected tasks, or return to the transcript and regenerate.

### 5.6 Track and complete

Accepted tasks enter Today's Tasks using the existing TaskJar completion and jar mechanisms. Task cards should show:

- scheduled time or flexible daypart;
- estimated duration;
- subtask progress;
- priority and difficulty;
- XP available;
- optional AI suggestion label.

Completing subtasks gives progress feedback but task XP should normally be awarded only when the parent task is completed.

## 6. UX requirements

### 6.1 Capture card states

The voice capture component must support these explicit states:

- `idle`
- `requesting-permission`
- `loading-model`
- `ready`
- `recording`
- `paused`
- `stopped`
- `generating-plan`
- `permission-denied`
- `unsupported-browser`
- `model-load-error`
- `microphone-error`

Do not overload one boolean such as `isRecording` for the full state machine.

### 6.2 Live subtitle behaviour

- Render final segments as committed text.
- Render the current partial segment with lower emphasis.
- Do not duplicate finalised words when the recogniser updates a partial hypothesis.
- Preserve punctuation if supported by the selected model; otherwise perform lightweight transcript cleanup after capture.
- Update the UI at a controlled rate to avoid rerendering on every raw audio frame.
- Keep the last spoken words visible.
- Show an audio activity indicator, but do not imply recording quality from volume alone.

### 6.3 Input alternatives

Voice is primary, but the user must always have:

- a **Type instead** fallback;
- transcript editing;
- manual task creation;
- retry after failure;
- keyboard-accessible controls.

### 6.4 Suggested-time explanation

Suggested times must include a short reason such as:

- “You said evening; suggested 7:30 PM.”
- “High-focus work placed in your first available focus window.”
- “Short errand grouped with another outside task.”
- “No exact time was given; this remains flexible.”

Avoid presenting inferred timing as something the user explicitly said.

## 7. Speech architecture

### 7.1 Browser pipeline

```text
Microphone permission
  -> MediaStream
  -> AudioContext / AudioWorklet
  -> mono PCM resampling to model sample rate
  -> worker boundary
  -> sherpa-onnx WASM online recogniser
  -> partial/final transcript events
  -> React capture state
  -> editable transcript
```

### 7.2 Isolation

Run speech decoding outside the React main thread using a Web Worker where supported. Audio processing should use AudioWorklet rather than deprecated ScriptProcessorNode.

Recommended modules:

```text
app/features/voice-capture/
  components/voice-capture-card.tsx
  components/live-transcript.tsx
  hooks/use-voice-capture.ts
  lib/audio-worklet.ts
  lib/sherpa-worker.ts
  lib/transcript-assembler.ts
  types.ts
public/models/sherpa-onnx/<model-version>/
```

The exact package and model filenames must be pinned and documented before implementation.

### 7.3 Model loading

- Lazy-load speech assets only when voice capture is first used.
- Show deterministic loading progress when asset sizes are known.
- Cache immutable model files through browser caching or a service worker.
- Version the model path so upgrades do not corrupt cached assets.
- Verify integrity where practical.
- Do not start microphone capture while the recogniser is unavailable.

### 7.4 Audio handling

- Prefer mono input.
- Resample to the recogniser's required sample rate.
- Avoid storing raw audio.
- Stop all tracks and close audio resources when capture ends or the component unmounts.
- Handle device changes and suspended AudioContext states.
- Place a maximum capture duration for v1, recommended 10 minutes, with a visible warning near the limit.

### 7.5 Browser support

Target current desktop and Android Chromium first. Detect capability rather than only user-agent strings. Unsupported browsers should receive typed input without a broken microphone experience.

## 8. AI planning contract

### 8.1 Input

```ts
interface PlanTasksRequest {
  transcript: string
  localDate: string
  timezone: string
  now: string
  preferences?: {
    wakeTime?: string
    sleepTime?: string
    preferredFocusPeriods?: Array<"morning" | "afternoon" | "evening">
    defaultBreakMinutes?: number
    maxPlannedMinutesPerDay?: number
  }
}
```

Do not trust client-provided dates or timezone blindly for security decisions, but retain them for schedule interpretation.

### 8.2 Output

```ts
type Daypart = "morning" | "afternoon" | "evening" | "night" | "anytime"
type ConstraintSource = "explicit" | "inferred" | "none"
type EnergyLevel = "low" | "medium" | "high"

interface PlannedSubtask {
  id: string
  title: string
  estimatedMinutes: number
  completed: false
}

interface PlannedTask {
  clientId: string
  title: string
  description: string
  priority: "urgent" | "scheduled" | "optional"
  difficulty: "light" | "standard" | "challenging"
  energy: EnergyLevel
  estimatedMinutes: number
  suggestedDate: string
  suggestedStartTime: string | null
  preferredDaypart: Daypart
  timingConstraintSource: ConstraintSource
  timingReason: string
  confidence: number
  subtasks: PlannedSubtask[]
  sourceExcerpt: string
  warnings: string[]
}

interface PlanTasksResponse {
  tasks: PlannedTask[]
  totalEstimatedMinutes: number
  planningWarnings: string[]
  unparsedNotes: string[]
}
```

### 8.3 Model rules

The planning prompt must instruct the model to:

1. Preserve the user's meaning and wording where practical.
2. Never invent deadlines, meetings, purchases, people, or obligations.
3. Split distinct outcomes into distinct tasks.
4. Keep a single outcome together even if it has multiple steps.
5. Add 0–5 subtasks only when they make execution clearer.
6. Avoid generic subtasks such as “start task” or “finish task.”
7. Estimate active work time, not elapsed calendar time, unless waiting is relevant.
8. Prefer rounded durations: 5, 10, 15, 20, 30, 45, 60, 75, 90, then larger blocks.
9. Mark duration as a recommendation.
10. Treat explicit times and deadlines as hard constraints.
11. Treat words like morning, after class, evening, before dinner, and tonight as constraints that still require user review.
12. Use energy demand to avoid stacking multiple high-energy tasks together.
13. Keep optional or “if I have energy” work optional.
14. Surface ambiguity in warnings rather than pretending certainty.
15. Return JSON matching the schema and no prose outside it.

## 9. Duration estimation

Duration should be based on task type, scope, stated progress, difficulty, and generated subtasks. The model may use average-human assumptions only as a fallback.

Recommended guardrails:

- Tiny action: 5–10 minutes
- Simple communication or purchase: 10–20 minutes
- Focused revision/session: 30–60 minutes
- Assignment segment or meaningful build task: 45–120 minutes
- Large or unclear work: split into subtasks or flag that the estimate is uncertain

Do not schedule more than the user's available day. When availability is unknown, calculate a total workload and warn when it exceeds a configurable default, recommended 6 hours of planned focused work.

## 10. Time recommendation rules

Use this precedence order:

1. Exact explicit date/time.
2. Explicit relative constraint, such as after class or before dinner.
3. Explicit daypart, such as morning or evening.
4. Existing user planning preferences.
5. Energy-aware defaults.
6. Leave flexible when evidence is weak.

Initial daypart defaults, used only when the user has no saved preference:

- morning: 9:00 AM
- afternoon: 2:00 PM
- evening: 7:00 PM
- night: 9:00 PM

These are placeholders for review, not universal truths. The product should later learn user preferences only through explicit settings or transparent feedback, not hidden behavioural profiling.

### Energy-aware defaults

- High-energy work: earlier available focus period.
- Medium-energy work: middle of available period.
- Low-energy errands/communication: later or between focus blocks.
- Insert a break after roughly 60–90 minutes of planned focus.
- Avoid overlapping tasks.
- Do not assign exact times to every task when a flexible order is more honest.

## 11. Task and data-model changes

The current `Task` type should evolve without breaking existing saved client data.

```ts
interface Subtask {
  id: string
  title: string
  completed: boolean
  estimatedMinutes?: number
  completedAt?: number
}

interface Task {
  // existing fields remain
  estimatedMinutes?: number
  energy?: "low" | "medium" | "high"
  suggestedStartTime?: string
  preferredDaypart?: "morning" | "afternoon" | "evening" | "night" | "anytime"
  timingConstraintSource?: "explicit" | "inferred" | "none"
  timingReason?: string
  sourceTranscript?: string
  aiGenerated?: boolean
  planningConfidence?: number
  subtasks?: Subtask[]
  actualMinutes?: number
}
```

Use optional fields during migration. Add a schema version to persisted state before making fields required.

## 12. API changes

Replace or version `/api/generate-tasks` with a structured endpoint such as:

```text
POST /api/plans/from-transcript
```

Server responsibilities:

- authenticate when auth exists;
- rate-limit by user/session/IP;
- validate request with Zod;
- reject empty or excessively large transcripts;
- construct the prompt on the server;
- request structured JSON output;
- validate and normalise output;
- clamp duration and confidence ranges;
- return safe errors without exposing provider internals;
- avoid logging full private transcripts in production;
- attach a request ID for diagnostics.

Do not interpolate user transcript directly into an unescaped instruction template that lets it alter system rules. Treat it as data in a clearly delimited section.

## 13. Gamification design

### 13.1 Principles

- Reward completion, not creating many tiny tasks.
- Do not incentivise unrealistic plans.
- Do not punish users for rescheduling.
- Avoid streak-loss pressure that encourages unhealthy usage.

### 13.2 XP

Retain existing base XP by difficulty, but calculate final task XP with bounded modifiers:

```text
base XP from difficulty
+ small planning bonus for tasks with meaningful subtasks
+ small completion bonus for finishing within the planned day
+ optional accuracy bonus for recording actual duration
```

Safeguards:

- no XP per generated subtask by default;
- cap bonuses to prevent farming;
- editing an AI task must not remove its eligibility;
- overdue tasks retain base XP;
- deleted/regenerated tasks grant no XP.

### 13.3 Useful additions

- **Daily Plan Ready:** small one-time reward after accepting a realistic plan.
- **Jar Momentum:** visual progress from accepted and completed work.
- **Estimate Calibration:** optional insight showing estimated vs actual time after enough data.
- **Balanced Day:** cosmetic badge when the user completes a reasonable mix of task energy levels; never use this as pressure.

## 14. Privacy and security

- Process speech recognition locally through WASM.
- Do not upload raw audio in v1.
- Clearly state when transcript text will be sent to the AI provider.
- Let users edit or remove sensitive content before generation.
- Do not retain complete transcripts by default after tasks are accepted.
- Add an explicit setting if transcript history is introduced later.
- Do not place API keys in client code.
- Redact transcript contents from production logs and analytics.
- Apply request size limits and rate limits.
- Defend against prompt injection inside spoken content by separating user data from system instructions and validating output.
- Treat generated times and priorities as untrusted suggestions until accepted.

## 15. Accessibility

- Every microphone control needs an accessible name and visible state.
- Recording status must not rely only on colour or animation.
- Provide keyboard controls for start, pause, resume, stop, discard, and generate.
- Announce major state changes through an ARIA live region without announcing every partial word.
- The live transcript itself should not overwhelm screen readers; provide a separate stable final-transcript region.
- Respect reduced-motion preferences.
- Maintain sufficient contrast in transcript, recording, and task review states.

## 16. Error handling

### Permission denied

Explain how to enable microphone access and keep typed entry available.

### Model download fails

Allow retry. Show approximate download requirements before retry when known. Fall back to typed input.

### Recognition is inaccurate

Keep editable transcript and provide restart/discard. Never automatically create tasks from low-quality partial text.

### No speech detected

Stop gracefully and ask the user to retry or type.

### Network or AI failure

Preserve the transcript locally in component state, allow retry, and do not force the user to speak again.

### Invalid model output

Attempt one server-side structured repair. If still invalid, return a recoverable error and keep the transcript.

### Overloaded day

Generate the tasks, but display a planning warning and leave lower-priority tasks unscheduled or propose moving them to another day.

## 17. Analytics events

Collect only product interaction metadata, not transcript contents:

- `voice_capture_started`
- `voice_permission_denied`
- `speech_model_loaded`
- `voice_capture_stopped`
- `voice_capture_discarded`
- `plan_generation_started`
- `plan_generation_succeeded`
- `plan_generation_failed`
- `generated_task_accepted`
- `generated_task_rejected`
- `generated_task_edited`
- `suggested_time_changed`
- `duration_changed`

Useful numeric properties include capture duration, transcript character count, task count, accepted count, generation latency, and model-load latency.

## 18. Performance targets

These are product targets, not guaranteed hardware-independent limits:

- Microphone UI response after user action: under 100 ms.
- Partial subtitle update during active speech: typically under 500 ms on supported hardware after model load.
- Main-thread interaction should remain responsive during decoding.
- No repeated model download after successful caching.
- Plan-generation loading state appears immediately.
- Task review should remain smooth for at least 30 generated tasks, though the AI should normally produce far fewer.

## 19. Acceptance criteria

### Speech capture

- User can grant microphone permission and begin recording.
- sherpa-onnx WASM produces continuously updating partial text.
- Final segments do not duplicate earlier partial text.
- User can pause, resume, stop, discard, and retry.
- Audio tracks and workers are cleaned up when capture ends.
- Typed input remains available when speech is unsupported or denied.

### Planning

- Edited transcript can be converted into schema-valid tasks.
- Explicit times in speech are preserved and labelled explicit.
- Dayparts are converted into editable suggested times and labelled inferred when appropriate.
- Each task includes a bounded duration estimate.
- Useful subtasks are generated for multi-step work and omitted for trivial tasks.
- Optional language remains optional.
- The system warns about ambiguity and overloaded plans.

### Review

- No generated task is saved without user confirmation.
- User can accept selected tasks rather than all tasks.
- User can edit title, description, duration, schedule, priority, difficulty, and subtasks.
- User can regenerate from the preserved transcript.

### Tracking and gamification

- Accepted tasks work with existing completion and jar progress.
- Task cards display new timing and duration information without breaking legacy tasks.
- Subtasks can be completed independently.
- XP is awarded once for the parent task and cannot be farmed through generated subtasks.

### Privacy

- Raw audio is not sent to the server.
- Transcript contents are not written to production analytics.
- Transcript is retained only as required for the active review flow unless the user opts into history later.

## 20. Test plan

### Unit tests

- transcript segment assembly and deduplication;
- capture reducer/state machine;
- duration clamps;
- daypart-to-time defaults;
- priority and difficulty mapping;
- Zod request/response schemas;
- XP modifier caps;
- migration of legacy tasks.

### Integration tests

- mocked sherpa worker partial/final events into the capture UI;
- transcript edit -> API request -> plan review;
- invalid AI response -> repair/failure path;
- selected-task acceptance;
- accepted task -> completion -> jar XP;
- microphone permission denied fallback;
- model-load failure fallback.

### End-to-end tests

Use a deterministic mocked speech worker in CI. Real microphone tests should be manual/device tests because CI microphone access is unreliable.

Scenarios:

1. Exact time: “Submit the form at 4 PM.”
2. Daypart: “Call Amma in the evening.”
3. Relative timing: “Revise after class.”
4. Optional work: “Maybe update my portfolio if I have energy.”
5. Multiple tasks in one sentence.
6. One large task requiring subtasks.
7. Transcript correction before generation.
8. Permission denied and typed fallback.
9. Offline speech capture followed by online generation retry.
10. Plan exceeding the recommended daily workload.

### Manual device matrix

- Windows Chrome/Edge
- macOS Chrome
- Android Chrome
- low-memory Android device
- slow network during first model download
- cached repeat use
- built-in and Bluetooth microphones

## 21. Open decisions before coding

1. Exact sherpa-onnx web package/version and compatible online ASR model.
2. Supported languages in v1; English-only is the safest initial scope unless a multilingual model is intentionally selected.
3. Model asset size budget and hosting/CDN strategy.
4. Persistence strategy: current local state, localStorage/IndexedDB, or a future backend.
5. AI provider/model upgrade from the current Gemini 1.5 Flash implementation.
6. Whether exact-time tasks become `scheduledFor` ISO timestamps or retain separate local date/time fields.
7. Whether accepted source excerpts are stored temporarily for explainability.

## 22. Definition of product success

The feature succeeds when a user can speak an unstructured description of their day, see accurate live text, make small corrections, receive a realistic and transparent proposed plan, accept it with minimal editing, and then complete those tasks through TaskJar's existing gamified workflow—without raw audio leaving the device.
