# Voice-First Planner Implementation Status

**Implemented:** July 27, 2026  
**Release target:** TaskJar local-first web app  
**Persistence schema:** v2

## Shipped in this implementation

### Voice capture

- Explicit capture states: idle, permission request, model loading, recording, paused, stopped, unsupported, permission denied, model error, and microphone error.
- Microphone PCM capture through AudioWorklet.
- 16 kHz mono resampling before transcription.
- Transcription outside React in a module Web Worker.
- Local Whisper Tiny English through Transformers.js, WebGPU when available and WASM otherwise.
- Browser caching of model assets.
- Three-second rolling transcript updates with overlap deduplication.
- Pause, resume, stop, discard, retry, ten-minute hard limit, track cleanup, and typed fallback.
- Editable transcript remains visible through failures and plan generation.

### Structured planning

- Strict Zod request, task, subtask, and plan schemas.
- Bounded task durations, confidence, task count, and subtask count.
- Local Gemma planner when an installed MediaPipe model and WebGPU are available.
- Deterministic offline rules planner otherwise.
- Prompt separation that treats transcripts as data.
- Optional-language preservation, energy inference, duration estimation, useful subtasks, exact-time parsing, daypart suggestions, timing explanations, and ambiguity warnings.
- Deterministic overload warnings and exact-time collision handling.

### Review and tracking

- Select all, select none, and individual inclusion.
- Editable title, description, priority, difficulty, energy, duration, date, time, and subtasks.
- Subtask add, edit, delete, and reorder.
- Source excerpt and explicit/inferred timing explanation.
- Regeneration from the preserved transcript and per-task regeneration.
- Task cards show timing, duration, energy, AI origin, subtask progress, and optional actual duration.
- Subtask completion does not award XP.
- `xpAwarded` prevents reopening/recompletion farming.
- Legacy task migration, raw legacy backup, and a versioned v2 state envelope.
- Markdown export includes timing, estimates, subtasks, actual time, and jar history without exporting full voice transcripts.

## Architecture decision versus the original plan

The original spike proposed a custom sherpa-onnx browser build. The shipped v1 uses the browser-oriented Transformers.js automatic-speech-recognition pipeline with `onnx-community/whisper-tiny.en` instead.

Reasons:

1. It provides a supported browser pipeline API and WebGPU/WASM fallback.
2. It runs in a Worker and caches model assets without checking large generated runtime files into TaskJar.
3. It preserves the product requirement that raw audio stays local.
4. It reduces deployment and upgrade risk for a small local-first application.

The voice runtime remains isolated behind `use-voice-capture.ts`, so sherpa-onnx can replace the worker later without changing tasks, review, persistence, or the UI contract.

## Remaining release validation

- Manual microphone/device tests on Windows Chrome/Edge, Android Chrome, macOS Chrome, Bluetooth microphones, and a low-memory Android device.
- Measure first model download, cached startup, transcription latency, and memory on real devices.
- Add deterministic worker mocks and automated unit/integration tests in a testing-focused change.
- Evaluate a multilingual speech model if Tamil/English mixed dictation becomes a requirement.
