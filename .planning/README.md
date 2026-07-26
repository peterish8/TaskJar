# TaskJar Planning

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
