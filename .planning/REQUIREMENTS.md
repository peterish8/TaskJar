# Voice-First Planning Requirements

## Requirement notation

- **P0** — required for the first production release.
- **P1** — important follow-up after the vertical slice is stable.
- **P2** — optional future enhancement.

## 1. Voice capture and live transcription

### VF-001 — Explicit microphone start and stop — P0

The app must request microphone access only after a direct user action. It must expose clear Start, Pause/Resume, and Stop controls.

Acceptance criteria:

- No microphone request occurs on page load.
- The active recording state is visually unmistakable.
- Stopping releases all microphone tracks and audio resources.
- Navigating away or unmounting the planner also releases resources.

### VF-002 — Browser-side recognition — P0

The default transcription path must run in the browser with sherpa-onnx WebAssembly. Raw audio must not be uploaded to TaskJar servers.

Acceptance criteria:

- Network inspection shows no audio upload during local recognition.
- The model and WASM assets may be fetched and cached.
- Only the final text transcript may be submitted to the AI planning endpoint.

### VF-003 — Continuous subtitles — P0

While the user speaks, interim recognition text must update continuously. Stable text must remain visible while new interim text changes.

Acceptance criteria:

- The transcript view distinguishes committed text from interim text.
- Interim updates do not duplicate committed words.
- A short pause does not erase the transcript or terminate the session.
- The user can scroll through a long transcript while recognition continues.

### VF-004 — Transcript controls — P0

The user must be able to edit, clear, undo the most recent committed segment, and resume speaking before task generation.

### VF-005 — Model lifecycle feedback — P0

The interface must expose model states: unsupported, idle, downloading, loading, ready, listening, paused, finalizing, and error.

Acceptance criteria:

- Model loading never appears as a frozen microphone button.
- Download progress is shown when measurable.
- A failed load offers Retry and typed-input fallback.

### VF-006 — Capability detection — P0

Before exposing voice as available, the client must check required capabilities such as WebAssembly, microphone access, workers, and audio capture support.

Typed planning must remain usable when voice is unsupported.

### VF-007 — Language selection — P0

The user must select or confirm a recognition language/model before first use. Auto-detection may be added later but must not be assumed to work reliably for every model.

### VF-008 — Mixed-language handling — P1

The architecture must permit models that support English plus relevant Indian languages and code-switching. The UI must not promise a language until the selected model has been validated for it.

## 2. Transcript-to-plan compilation

### AI-001 — Structured output contract — P0

The server must convert a final transcript into a versioned JSON object validated with Zod. Free-form text parsing and regex extraction are not acceptable.

### AI-002 — Preserve explicit constraints — P0

The compiler must extract and preserve:

- explicit date or day;
- deadline;
- exact start time;
- time-of-day preference;
- user-stated duration or maximum duration;
- ordering/dependency language;
- mandatory versus optional intent;
- recurrence when explicitly stated.

Explicit user constraints always outrank inferred recommendations.

### AI-003 — Actionable task titles — P0

Each task title must begin with a clear action and remain specific enough to complete, for example, “Submit DBMS assignment” rather than “DBMS.”

### AI-004 — Recommended subtasks — P0

The AI must recommend subtasks when they reduce ambiguity or make a task startable.

Rules:

- Default to 2–5 subtasks for work estimated above 30 minutes.
- Do not add ceremonial subtasks such as “start task” or “finish task.”
- Preserve a simple task as one task when decomposition adds no value.
- Each subtask must have a title, completion state, sequence, and optional estimated minutes.
- The user can delete, rename, reorder, or add subtasks before saving.

### AI-005 — Duration estimation — P0

When the user does not specify duration, the AI must estimate a realistic range and select a planning value.

Each estimate must contain:

- `estimatedMinutes` used for scheduling;
- `estimateRangeMinutes.min`;
- `estimateRangeMinutes.max`;
- `estimateConfidence`: low, medium, or high;
- a short editable rationale.

User-stated durations are marked `source: explicit` and must not be replaced by estimates.

### AI-006 — Energy classification — P0

Each task must be classified as low, medium, or high cognitive/physical energy, with a short rationale where useful.

The system must not claim to medically measure the user's energy.

### AI-007 — Priority and difficulty mapping — P0

The AI output must map safely into TaskJar's current concepts:

- priority: urgent, scheduled, optional;
- difficulty: light, standard, challenging.

The mapping must be validated centrally, not repeated in UI components.

### AI-008 — Clarification strategy — P0

The AI should avoid blocking questions for every ambiguity. It must:

1. preserve the user's words;
2. make conservative assumptions where safe;
3. attach warnings to material uncertainty;
4. request clarification only when a wrong assumption would materially change the day.

For M1, clarification can appear in the review screen rather than requiring a conversational loop.

### AI-009 — Overload detection — P0

The compiler/scheduler must calculate the proposed workload and flag a plan that exceeds the user's configured available time or a conservative default.

It should recommend deferring optional tasks rather than silently compressing estimates.

## 3. Time recommendation and scheduling

### SC-001 — Scheduling sources — P0

Every scheduled recommendation must record its source:

- `explicit_exact`;
- `explicit_window`;
- `explicit_daypart`;
- `inferred_energy_fit`;
- `inferred_deadline_fit`;
- `unscheduled`.

### SC-002 — Daypart interpretation — P0

If a user says morning, afternoon, evening, or night without an exact time, TaskJar may suggest a time inside a configurable default window.

Initial defaults:

- morning: 08:00–11:30;
- afternoon: 12:30–16:30;
- evening: 17:00–20:30;
- night: 20:30–23:00.

These are product defaults, not universal human truths, and must be configurable later.

### SC-003 — Energy-aware recommendations — P0

When no time is specified, the scheduler should generally place:

- high-energy tasks in the user's strongest available focus window;
- medium-energy tasks in normal work windows;
- low-energy/admin tasks in lower-energy gaps.

For a new user with no learned profile, use transparent generic defaults and label the time as recommended.

### SC-004 — Dependency and deadline safety — P0

The schedule must respect dependencies, avoid finishing after deadlines, and include a small buffer for deadline-bound work when possible.

### SC-005 — Conflict handling — P0

When two explicit constraints conflict, do not silently pick one. Mark the affected tasks and show the conflict in review.

### SC-006 — User-editable plan — P0

Every recommended date, start time, and duration must be editable before saving. The UI must visually distinguish “you said” from “TaskJar suggests.”

### SC-007 — No fake precision — P0

When confidence is low, prefer a time window or unscheduled recommendation over an unjustified exact minute.

### SC-008 — Personal energy profile — P1

Users may configure preferred wake time, sleep time, strong focus window, class/work blocks, meal windows, and maximum planned hours. Later, TaskJar may learn from accepted/edited recommendations with explicit consent.

## 4. Review and task creation UX

### UX-001 — Review-first flow — P0

After transcription, show a structured review screen before persistence.

The review screen must include:

- original editable transcript;
- task cards;
- subtasks;
- priority and difficulty;
- duration and confidence;
- energy;
- explicit constraints;
- recommended schedule;
- warnings/conflicts;
- per-task include/exclude toggle.

### UX-002 — Regeneration scope — P0

The user must be able to regenerate all tasks or one task without losing manual edits to unrelated tasks.

### UX-003 — Manual fallback — P0

The existing manual task creation and typed AI input must remain functional.

### UX-004 — Accessibility — P0

- All recording controls require accessible names.
- Recording state must not rely only on color.
- Live transcript updates should avoid excessively noisy screen-reader announcements.
- Keyboard users must be able to operate the entire review flow.
- Reduced-motion preferences must be respected.

## 5. Gamification

### GM-001 — XP calculation — P0

XP must be derived deterministically from accepted task effort and difficulty, not trusted from arbitrary model output.

Suggested initial formula:

- base XP from planning duration bucket;
- multiplier from difficulty;
- small bounded bonus for urgent/deadline tasks;
- hard minimum and maximum per parent task.

The final formula belongs in one domain function with tests.

### GM-002 — Subtask progress — P0

Subtasks contribute progress toward the parent task but do not independently mint unlimited XP.

Recommended behavior:

- Parent XP is fixed when the task is accepted.
- Completing subtasks updates fractional task progress.
- Parent XP is awarded once, when the parent task reaches completion.
- Manual “complete parent” remains possible with confirmation if subtasks remain.

### GM-003 — No punishment loop — P0

Missing or rescheduling a task must not remove earned XP or shame the user. The product can show consistency and recovery, but must not encourage compulsive engagement.

### GM-004 — Jar compatibility — P0

Accepted voice-generated tasks must use the existing jar completion pathway and history. Existing jar records must remain readable after migration.

## 6. Privacy, security, and reliability

### PR-001 — Audio retention — P0

Raw audio is ephemeral. Do not write it to localStorage, IndexedDB, logs, analytics, or a server unless a future explicit opt-in recording feature is designed.

### PR-002 — Transcript disclosure — P0

Before first AI generation, tell the user that the text transcript—not the audio—will be sent to the configured AI provider.

### PR-003 — Prompt-injection resistance — P0

Treat transcript content as user data, not instructions that can override system behavior. Use structured prompting and strict schema validation.

### PR-004 — Secrets — P0

AI provider keys stay server-side. The browser must never receive provider secrets.

### PR-005 — Input limits — P0

Apply reasonable transcript size limits, request timeouts, rate limits, and clear error messages. Avoid logging full personal transcripts in production.

### PR-006 — Graceful recovery — P0

A recognition crash, worker crash, network failure during AI generation, or invalid model response must not discard the user's transcript.

## 7. Analytics without surveillance

### AN-001 — Minimal product events — P1

Permitted events should avoid transcript text and raw audio. Examples:

- voice model load success/failure;
- recording started/stopped;
- transcript duration and character count buckets;
- AI compile success/failure;
- number of proposed versus accepted tasks;
- number of schedule edits;
- task completion duration buckets.

No personal speech content belongs in analytics payloads.

## 8. Out of scope for the first release

- Automatic Google Calendar writes.
- Background wake-word detection.
- Emotion recognition from voice.
- Speaker identification.
- Cloud synchronization/accounts.
- Full conversational assistant loop.
- Automatic rescheduling without review.
