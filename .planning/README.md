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
