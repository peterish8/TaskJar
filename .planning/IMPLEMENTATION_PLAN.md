# Voice-First Implementation Plan

## Delivery strategy

Build one vertical slice at a time. Do not redesign the entire app before proving browser recognition and the proposal-review-save loop.

Every phase must leave the repository buildable and keep typed/manual planning working.

## Phase 0 — Baseline stabilization

### Goal

Make the current behavior safe to extend.

### Tasks

- Add a conventional lint script compatible with the installed Next.js version.
- Add unit-test tooling and a minimal CI check.
- Centralize current priority/difficulty mappings.
- Add Zod schemas for the existing task-generation response.
- Remove unchecked `any` casts from AI response mapping.
- Add clear server handling for missing AI API configuration.
- Capture current manual task, AI generation, completion, jar rollover, and weekly scheduling behavior in tests.

### Exit criteria

- Existing app builds and tests pass.
- Malformed AI output cannot enter task state.
- Current core flows have regression coverage.

## Phase 1 — Domain model and migration

### Goal

Introduce V2 task/planning entities without changing the visible product flow.

### Tasks

- Add schemas and types from `DATA_MODEL.md`.
- Implement legacy localStorage migration.
- Introduce `TaskJarRepository` and localStorage implementation.
- Move XP calculation into a tested domain function.
- Add proposal-to-task acceptance conversion.
- Add subtask progress behavior while keeping existing parent completion compatible.
- Replace ambiguous date-string handling with date + timezone fields for new records.

### Exit criteria

- Existing stored data migrates idempotently.
- Legacy jars and completed tasks remain visible.
- New and migrated tasks can be completed and award XP exactly once.

## Phase 2 — sherpa-onnx technical spike

### Goal

Prove continuous browser transcription in isolation before integrating it into TaskJar UI.

### Tasks

- Select one sherpa-onnx online ASR model based on measured browser size, memory, latency, language, and accuracy.
- Record selected model version, license, asset sizes, required sample rate, and supported language claims.
- Add a hidden developer route or Storybook-like harness.
- Load WASM/model inside a dedicated worker.
- Capture mono microphone audio.
- Use AudioWorklet or a safe initial bridge for PCM frames.
- Display interim and committed segments.
- Measure first-load time, cached-load time, memory, and real-time behavior.
- Test repeated start/stop cycles and cleanup.

### Device/browser matrix

At minimum test:

- current Chrome desktop on Windows;
- current Edge desktop on Windows;
- current Chrome Android on one mid-range and one stronger device if mobile web is supported;
- Safari only after verifying the runtime/model actually works there.

### Exit criteria

- Speech produces continuous interim text on at least the defined primary browser.
- UI remains responsive.
- No audio network request occurs.
- Five repeated sessions do not show growing streams/workers or obvious memory leakage.
- Unsupported devices receive a typed fallback.

### Stop condition

Do not proceed by assuming all languages or mobile devices work. If the chosen model fails product requirements, select a different sherpa-onnx model or narrow the supported matrix explicitly.

## Phase 3 — Voice session UI

### Goal

Replace the daily textarea as the default interaction while preserving text editing.

### Tasks

- Build the voice-session state machine/reducer.
- Add model preparation status and optional explicit download action.
- Add Start, Pause, Resume, Stop, Retry, Clear, Undo segment, and Edit transcript controls.
- Display stable and interim captions distinctly.
- Preserve transcript after recoverable recognition errors.
- Add disclosure that audio stays local and transcript text is sent only during AI planning.
- Add language/model setting.
- Ensure cleanup on route change, tab visibility changes where appropriate, and component unmount.
- Keep the textarea available as an editable transcript/fallback.

### Exit criteria

- A user can speak, see subtitles, correct them, and proceed without typing from scratch.
- Keyboard and screen-reader operation is possible.
- Denied microphone permission does not block typed planning.

## Phase 4 — Structured plan compiler API

### Goal

Turn the final transcript into safe, reviewable proposals.

### Tasks

- Add `/api/plan/compile` request/response schemas.
- Add AI provider abstraction.
- Move provider/model configuration to environment settings.
- Write the versioned plan compiler prompt.
- Request structured output where supported.
- Validate output with Zod.
- Add bounded retry/repair for invalid structured responses.
- Preserve transcript on network/provider failure.
- Add request size limits, timeout, and rate limiting.
- Avoid logging full transcripts.
- Return tasks, subtasks, constraints, estimates, assumptions, and warnings.

### Exit criteria

- Invalid provider output never reaches the client as a valid plan.
- Explicit duration/time/deadline examples survive compilation.
- Prompt-injection-like transcript content remains plain user data.

## Phase 5 — Deterministic timing recommendations

### Goal

Create realistic scheduling suggestions from extracted semantics and user preferences.

### Tasks

- Add default daypart windows and planning preferences.
- Normalize explicit dates/times in the user's timezone.
- Lock explicit timing and duration constraints.
- Implement conflict detection.
- Implement a deterministic greedy scheduler for remaining tasks.
- Add transition buffers and daily maximum planned time.
- Add energy-aware placement.
- Add overload calculation and deferral suggestions.
- Return unscheduled rather than fabricate impossible slots.
- Add unit tests around deadlines, dayparts, dependencies, and overload.

### Exit criteria

- Explicit times always win.
- Conflicts are visible, not silently resolved.
- A full day does not receive additional fake slots.
- Recommendations show their source and are editable.

## Phase 6 — Plan review and acceptance

### Goal

Give the user complete control before tasks are stored.

### Tasks

- Build the plan review screen.
- Show original transcript and all proposal fields.
- Support include/exclude per task.
- Support task/subtask editing and reordering.
- Support duration, energy, priority, difficulty, date, time, and time-window edits.
- Show “You said” versus “TaskJar suggests.”
- Show workload and conflict warnings.
- Add regenerate-all and regenerate-one actions with edit preservation.
- Convert accepted proposals into V2 tasks in one atomic state update.
- Add duplicate submission protection.

### Exit criteria

- No proposal is persisted without confirmation.
- The user can fix every AI-controlled field.
- Double-clicking acceptance does not create duplicates.

## Phase 7 — Gamification integration

### Goal

Make richer tasks feel native to TaskJar's jar loop.

### Tasks

- Render task progress from subtasks.
- Award parent XP exactly once.
- Show duration and energy without cluttering core task cards.
- Keep jar rollover behavior stable.
- Add celebratory feedback proportional to completion, respecting reduced motion.
- Add overload recovery messaging without punishment.
- Tune XP buckets against representative generated tasks.

### Exit criteria

- Subtasks cannot inflate XP.
- Existing and voice-created tasks behave identically in jar/history flows.
- Rescheduling does not remove earned XP.

## Phase 8 — Production hardening

### Goal

Make the feature safe to release.

### Tasks

- Run the full test matrix in `TEST_PLAN.md`.
- Add CSP/worker/WASM deployment configuration.
- Verify model MIME types and cache headers.
- Verify no raw audio or transcript content enters analytics/logs.
- Add error boundaries around voice and review features.
- Add retry and recovery paths for worker/model/provider failures.
- Measure bundle impact separately from lazy-loaded model assets.
- Add a kill switch/feature flag for voice capture and AI compilation.
- Add documentation for supported browsers/languages and known limitations.

### Exit criteria

- Production build passes.
- Primary browser/device matrix passes.
- Privacy network inspection passes.
- Model/provider outages leave typed/manual task management usable.

## Phase 9 — Follow-up improvements

Only after M1 usage data and failure modes are understood:

- Voice support on weekly dump.
- Optional IndexedDB/service-worker model management UI.
- Personal energy-profile onboarding.
- Learning from accepted schedule edits with explicit consent.
- Calendar read integration for availability.
- Calendar write integration with per-event confirmation.
- Additional verified language models.
- Offline AI task structuring if a sufficiently capable browser model becomes practical.

## Suggested work order for an AI coding agent

For each phase:

1. Read `.planning/PROJECT.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, and this file.
2. Inspect current code before editing.
3. Write/adjust tests first for domain behavior and bug fixes.
4. Make the smallest cohesive implementation.
5. Run type-check, lint, tests, and production build.
6. Record decisions or deviations in `.planning/DECISIONS.md`.
7. Do not start the next phase while current exit criteria fail.

## Definition of done for M1

A supported-browser user can open Today, prepare the local model, speak an unstructured list, see live subtitles, edit the transcript, generate a structured plan, review recommended subtasks/durations/timing, accept selected tasks, complete them, and receive jar XP—without raw audio leaving the device and without breaking typed/manual flows.
