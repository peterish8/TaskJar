# Phase 01 — Voice-First AI Planner

**Objective:** Ship a reliable voice-first daily planning flow that transcribes speech locally with sherpa-onnx WASM, converts the reviewed transcript into structured tasks, and preserves TaskJar's existing XP and jar mechanics.

## Phase 1A — Stabilise planning contracts

### Deliverables

- Add Zod schemas for transcript-plan request and response.
- Define `PlannedTask`, `PlannedSubtask`, timing, energy, and warning types.
- Extend `Task` with optional duration, energy, timing explanation, AI metadata, and subtasks.
- Add a persisted-state schema version and legacy migration path before new fields become required.
- Replace string interpolation in the existing AI prompt with a clearly delimited structured prompt.
- Create a versioned endpoint: `POST /api/plans/from-transcript`.

### Engineering tasks

1. Create `app/features/planning/types.ts`.
2. Create `app/features/planning/schemas.ts`.
3. Create `app/features/planning/normalise-plan.ts`.
4. Add bounded values:
   - estimated minutes: 5–480 per task;
   - confidence: 0–1;
   - subtasks: 0–5;
   - transcript length: configurable, recommended 12,000 characters.
5. Return stable error codes such as:
   - `INVALID_REQUEST`
   - `TRANSCRIPT_TOO_LONG`
   - `MODEL_OUTPUT_INVALID`
   - `RATE_LIMITED`
   - `PROVIDER_UNAVAILABLE`
6. Add unit tests for schema validation, duration clamping, and mapping to the current TaskJar task values.

### Exit criteria

- A typed transcript can produce schema-valid planned tasks.
- Existing typed generation is not removed until the new endpoint works.
- Invalid provider output never reaches the UI unchecked.

## Phase 1B — sherpa-onnx WASM technical spike

### Goal

Prove that the chosen sherpa-onnx WASM package and online model can provide usable partial and final transcripts in the target browsers.

### Deliverables

- Pin exact package and model versions.
- Record model download size, memory use, initialisation time, and typical partial-result latency.
- Confirm required audio sample rate and input format.
- Confirm worker compatibility and asset-loading approach under Next.js.
- Document supported language(s), licence, and attribution requirements.

### Spike UI

Create a development-only page or isolated component that supports:

- initialise model;
- request microphone;
- start/stop capture;
- display raw partial result;
- display final segments;
- cleanly terminate the worker and audio tracks.

### Failure gates

Do not continue with the selected model if:

- it regularly freezes the main thread;
- its memory footprint breaks common Android devices;
- asset size is unacceptable for the product;
- partial transcript latency is too high for a live-subtitle experience;
- the licence or redistribution requirements are incompatible.

### Exit criteria

- Working desktop Chromium demo.
- Working Android Chrome demo on at least one mid-range device.
- Written decision on model, package, language scope, and asset delivery.

## Phase 1C — Production voice-capture module

### Proposed structure

```text
app/features/voice-capture/
  components/voice-capture-card.tsx
  components/live-transcript.tsx
  components/permission-help.tsx
  hooks/use-voice-capture.ts
  lib/capture-reducer.ts
  lib/transcript-assembler.ts
  workers/sherpa.worker.ts
  worklets/pcm-capture.worklet.ts
  types.ts
```

### Deliverables

- Explicit capture reducer/state machine.
- Lazy speech-model initialisation.
- AudioWorklet PCM capture and resampling.
- Web Worker recogniser execution.
- Partial/final transcript event protocol.
- Transcript assembly without duplicated words.
- Pause, resume, stop, discard, retry.
- Typed fallback.
- Cleanup on stop, route change, error, and component unmount.
- Maximum capture-duration warning and hard limit.

### Worker event contract

```ts
type SpeechWorkerToUI =
  | { type: "MODEL_PROGRESS"; loaded: number; total?: number }
  | { type: "READY" }
  | { type: "PARTIAL"; text: string }
  | { type: "FINAL"; text: string; sequence: number }
  | { type: "ERROR"; code: string; message: string }
```

```ts
type UIToSpeechWorker =
  | { type: "INIT"; modelBaseUrl: string }
  | { type: "AUDIO"; samples: Float32Array }
  | { type: "RESET" }
  | { type: "TERMINATE" }
```

Use transferable buffers where safe to reduce copying.

### Exit criteria

- Voice capture works repeatedly without page refresh.
- No microphone indicator remains active after stopping.
- Partial/final text remains stable and editable.
- Unsupported/denied states fall back cleanly to typing.

## Phase 1D — Voice-first Todo page UX

### Deliverables

Replace the current typing-first AI generator card with:

1. idle `Speak my day` state;
2. model loading state;
3. live recording state with subtitles;
4. stopped transcript-review state;
5. `Make my plan` action;
6. typed fallback and manual edit controls.

### UI rules

- Do not hide the transcript after generation starts.
- Preserve the transcript after network/model errors.
- Never auto-save generated tasks.
- Display explicit versus inferred timing clearly.
- Provide an obvious discard action that requires confirmation only when meaningful transcript text exists.
- Ensure mobile controls are thumb reachable.

### Exit criteria

- A first-time user can complete the full capture flow without reading documentation.
- Keyboard-only operation is possible.
- Screen readers receive major status changes without every partial subtitle update.

## Phase 1E — Structured plan review

### Deliverables

Build a review surface that supports:

- select all / select none;
- accept or exclude individual tasks;
- edit title and description;
- edit priority and difficulty;
- edit estimated minutes;
- edit suggested date/time or daypart;
- view timing reason and source excerpt;
- add/edit/delete/reorder subtasks;
- display plan overload and ambiguity warnings;
- regenerate from the same transcript.

### Scheduling algorithm responsibilities

The AI may propose task attributes, but deterministic application code must:

- clamp duration;
- prevent overlapping exact-time suggestions;
- honour explicit constraints first;
- flag, not silently move, impossible explicit constraints;
- avoid assigning exact times when only ordering is justified;
- calculate total planned minutes;
- mark lower-priority work flexible when the day is overloaded.

### Exit criteria

- User can accept only selected tasks.
- All editable values persist into TaskJar tasks.
- Regeneration does not destroy the transcript.

## Phase 1F — Task cards, subtasks, and timing

### Deliverables

- Add estimated duration and timing display to task cards.
- Add collapsible subtask list and progress count.
- Allow independent subtask completion.
- Preserve parent task completion as the XP-awarding action.
- Support legacy tasks with no new metadata.
- Add optional actual-duration entry after completion.

### Exit criteria

- Legacy tasks render unchanged.
- New tasks render all relevant planning metadata.
- Completing subtasks does not duplicate XP.

## Phase 1G — Gamification update

### Deliverables

- Keep current base XP from difficulty.
- Add bounded, transparent modifiers only where valuable.
- Add one-time `Daily Plan Ready` reward if product design retains it.
- Add anti-farming checks.
- Update jar calculations and history views to tolerate subtasks and optional planning metadata.

### Required tests

- task XP awarded once;
- toggling subtasks cannot generate XP;
- regeneration cannot generate XP;
- deleting/recreating tasks cannot preserve completion rewards incorrectly;
- legacy jar history remains readable.

## Phase 1H — Privacy, reliability, and release hardening

### Privacy

- Verify no raw audio network requests.
- Remove transcript bodies from production logs.
- Do not send analytics properties containing spoken text.
- Add in-product disclosure before first AI submission.
- Stop and release media tracks on every terminal path.

### Reliability

- Add request timeout and retry UX.
- Add server rate limiting.
- Add provider error mapping.
- Add worker crash recovery.
- Add model cache versioning.
- Add graceful behaviour while offline after the model is cached.

### Performance

- Profile main-thread responsiveness during transcription.
- Measure model initialisation and repeated cached startup.
- Measure Android memory use.
- Avoid rerendering the full Todo page for every partial word.

### Accessibility

- Test keyboard flow.
- Test ARIA state announcements.
- Test reduced motion.
- Test colour-independent recording/error status.

### Exit criteria

- All acceptance criteria in the feature specification pass.
- No raw audio reaches TaskJar servers.
- Typed task generation still works as a fallback.
- The feature is stable on the defined browser/device matrix.

## Suggested implementation order by pull request

1. **PR 1:** Types, schemas, new planning endpoint, tests.
2. **PR 2:** sherpa technical spike and documented model decision.
3. **PR 3:** production worker/worklet voice-capture infrastructure.
4. **PR 4:** voice-first capture UI and transcript editing.
5. **PR 5:** structured plan review and deterministic scheduling safeguards.
6. **PR 6:** subtasks, task-card timing, persistence migration.
7. **PR 7:** gamification integration, privacy hardening, analytics, E2E coverage.

Keep pull requests independently testable. Do not combine the model spike, complete UI redesign, new API, persistence migration, and gamification changes in one patch.

## Final definition of done

- User speaks instead of typing.
- Live subtitles update continuously through sherpa-onnx WASM.
- Raw audio remains local.
- User edits the transcript before AI planning.
- AI returns validated tasks with useful subtasks, realistic durations, and transparent suggested timing.
- Explicit user constraints override inference.
- User reviews and accepts selected tasks.
- Accepted tasks integrate with existing completion, XP, jars, and history.
- Failures preserve user work and always offer a typed fallback.
