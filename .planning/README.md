# TaskJar Planning

This folder is the implementation source of truth for the voice-first planning milestone.

## Read in this order

1. [`PROJECT.md`](./PROJECT.md) — product direction, scope, principles, and success measures.
2. [`REQUIREMENTS.md`](./REQUIREMENTS.md) — prioritized product, speech, planning, scheduling, gamification, privacy, and accessibility requirements.
3. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — browser STT, worker/audio design, AI boundary, deterministic scheduler, persistence, and deployment architecture.
4. [`DATA_MODEL.md`](./DATA_MODEL.md) — V2 persisted state, proposals, subtasks, constraints, schedule provenance, XP policy, and migration.
5. [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) — phased build order and exit criteria.
6. [`TEST_PLAN.md`](./TEST_PLAN.md) — unit, integration, browser, privacy, performance, accessibility, and release gates.

## Central milestone

TaskJar should let a user speak an unstructured account of what they need to do, show local live subtitles through sherpa-onnx WebAssembly, and turn the reviewed transcript into an achievable plan with editable tasks, subtasks, effort estimates, energy labels, and timing recommendations.

Raw microphone audio stays in the browser. Only the final transcript text is sent to the configured AI planning provider. Generated work remains a proposal until the user confirms it.

## Agent rules

- Inspect the repository before implementing a phase.
- Preserve typed/manual input as a fallback.
- Do not run speech inference on the React main thread.
- Do not persist or upload raw audio.
- Do not trust AI output without schema validation.
- Do not calculate XP in the AI prompt.
- Explicit user constraints outrank recommendations.
- Do not silently resolve scheduling conflicts.
- Complete and verify one phase before beginning the next.
This directory is the implementation source of truth for major TaskJar product work.

## Current priority

1. **Voice-First AI Daily Planner** — replace typing-first task capture with continuous local speech transcription, then transform the transcript into an editable, realistic, gamified daily plan.

## Documents

- [`features/voice-first-ai-planner.md`](./features/voice-first-ai-planner.md) — product requirements, UX, architecture, data flow, AI contract, privacy, edge cases, acceptance criteria, and testing.
- [`phases/01-voice-first-ai-planner.md`](./phases/01-voice-first-ai-planner.md) — implementation phases, tasks, dependencies, and definition of done.

## Product principles

- Speaking is the primary capture method; typing remains a fallback and correction tool.
- Live transcription must feel immediate and remain visible while the user speaks.
- The AI must organise what the user said without silently inventing commitments.
- Suggested durations and times are recommendations, not facts.
- Explicit user constraints always override inferred schedules.
- Every AI-generated plan must be reviewable before it changes the task list.
- Gamification rewards useful completion behaviour, not task inflation or unhealthy overwork.
- Audio should remain on-device by default; only the final transcript or explicitly approved text may be sent to the task-planning API.

## Existing TaskJar integration points

The current application already has:

- a natural-language task generator at `app/api/generate-tasks/route.ts`;
- a typed AI input and generated-task review flow in `app/components/todo-page.tsx`;
- task priority, difficulty, XP, completion, creation time, and optional schedule fields in `app/types.ts`;
- jar progress and completion gamification.

The voice-first feature should evolve these paths rather than create a parallel task system.
