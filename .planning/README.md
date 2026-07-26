# TaskJar Planning

This directory is the implementation source of truth for major TaskJar product work.

## Current priority

1. **Voice-First AI Daily Planner — implementation complete, device validation pending.** TaskJar now records microphone PCM, transcribes locally in a browser worker with a cached Whisper Tiny English model, keeps the transcript editable, generates a transparent structured plan locally, supports selective acceptance, subtasks, duration/timing review, and XP-safe completion.

## Documents

- [`PROJECT.md`](./PROJECT.md) — product direction and fixed principles.
- [`REQUIREMENTS.md`](./REQUIREMENTS.md) — prioritized product requirements.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — original architecture proposal.
- [`DATA_MODEL.md`](./DATA_MODEL.md) — persistence and domain requirements.
- [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) — original phased plan.
- [`TEST_PLAN.md`](./TEST_PLAN.md) — release validation target.
- [`features/voice-first-ai-planner.md`](./features/voice-first-ai-planner.md) — detailed product specification.
- [`phases/01-voice-first-ai-planner.md`](./phases/01-voice-first-ai-planner.md) — phased delivery checklist.
- [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md) — shipped mapping, deliberate deviations, and remaining manual tests.

## Product principles retained

- Speaking is the primary capture method; typing remains a fallback and correction tool.
- Microphone audio is processed in-browser and is never uploaded by TaskJar.
- The planner organises what the user said without silently inventing commitments.
- Suggested durations and times remain editable recommendations.
- Explicit constraints override inference.
- Every generated plan is reviewed before it changes the task list.
- Subtasks never award XP; the parent task awards XP once.

## Current integration points

- `app/features/voice-capture/` owns capture state, PCM worklet integration, transcript assembly, and voice UI.
- `public/taskjar-pcm-worklet.js` captures microphone PCM.
- `public/taskjar-voice-worker.js` runs local Whisper transcription outside React's main thread.
- `app/features/planning/` owns schemas, normalization, bounded values, overload warnings, timing conflicts, and XP policy.
- `app/components/plan-review-modal.tsx` provides selective review and editing.
- `app/lib/taskjar-repository.ts` owns versioned local persistence and legacy migration.
- `app/page.tsx` integrates voice, typed fallback, subtasks, weekly planning, jar XP, and Markdown export.
