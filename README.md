# TaskJar Local

TaskJar is a private, voice-first, local-first task planner. It has no authentication flow, no cloud database, and no server-side AI dependency.

## Core workflow

1. Open the local workspace directly.
2. Speak naturally or type a brain dump.
3. Edit the transcript before planning.
4. Review every proposed task, time, duration, priority, difficulty, energy level, and subtask.
5. Accept only the tasks you want.
6. Complete tasks and fill jars without subtask or reopen/recomplete XP farming.
7. Export the full journey as clean Markdown for Hermes, Claude, ChatGPT, Codex, or another agent.

## Local AI

### Speech

Voice capture records PCM through an AudioWorklet and sends it only to a browser Web Worker. The worker uses Transformers.js with `onnx-community/whisper-tiny.en`, running through WebGPU when available and WASM otherwise. Model files are cached by the browser. Raw microphone audio is not uploaded by TaskJar.

### Task planning

Task planning can use MediaPipe Tasks GenAI and one of two optional quantised Gemma profiles:

- Gemma 3 270M Q4 — approximately 249 MB.
- Gemma 3 1B Q4 — approximately 776 MB.

A deterministic offline planner remains available without a downloaded LLM or WebGPU.

## Local data

- Tasks, settings, subtasks, timing metadata, actual duration, and jar progress use browser storage.
- Daily planning includes overdue carry-over tasks.
- Weekly planning uses exact `yyyy-MM-dd` dates.
- Persisted task data is migrated to schema version 2.
- Full voice transcripts are not retained in accepted task history; only short source excerpts may be kept for timing explainability.

## Development

```bash
corepack enable
pnpm install
pnpm dev
```

Production validation:

```bash
pnpm typecheck
pnpm build
```

TaskJar currently pins Next.js `15.5.21`, the July 2026 maintenance-LTS security release.

## Planning documentation

See [`.planning/README.md`](./.planning/README.md) and [`.planning/IMPLEMENTATION_STATUS.md`](./.planning/IMPLEMENTATION_STATUS.md) for the original voice-first specification, implementation mapping, and remaining manual device validation.
