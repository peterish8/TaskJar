# Voice-First Architecture

## 1. System overview

```text
User microphone
  -> AudioWorklet (PCM frames)
  -> STT Web Worker
  -> sherpa-onnx WASM online recognizer
  -> interim + committed transcript
  -> editable transcript buffer
  -> POST /api/plan/compile
  -> provider adapter + structured output
  -> Zod validation + normalization
  -> deterministic scheduling pass
  -> review UI
  -> accepted Task records
  -> local repository + XP/jar domain logic
```

The system intentionally separates speech recognition, AI interpretation, scheduling, persistence, and gamification. No UI component should own all five responsibilities.

## 2. Suggested folder structure

```text
app/
  api/
    plan/
      compile/route.ts
  components/
    voice-planner/
      voice-planner.tsx
      recorder-controls.tsx
      transcript-editor.tsx
      model-status.tsx
      plan-review.tsx
      task-proposal-card.tsx
  types.ts                         # temporary compatibility exports only

features/
  voice-capture/
    audio-worklet/
      pcm-processor.ts
    worker/
      stt.worker.ts
    sherpa/
      create-online-recognizer.ts
      model-manifest.ts
    hooks/
      use-voice-session.ts
    types.ts

  planning/
    api/
      compile-plan.client.ts
    domain/
      plan-schema.ts
      normalize-plan.ts
      schedule-plan.ts
      constraint-parser.ts
      xp-policy.ts
      migrations.ts
    components/
      ...
    types.ts

lib/
  ai/
    provider.ts
    gemini-provider.ts
    prompts/
      compile-daily-plan.ts
  storage/
    taskjar-repository.ts
    local-storage-repository.ts
```

The exact folders may be adapted to existing conventions, but the boundaries should remain.

## 3. Browser STT subsystem

### Main-thread responsibilities

- Request microphone permission after a user gesture.
- Create and close the `AudioContext`.
- Load the AudioWorklet module.
- Route PCM frames to the worker using transferable buffers where possible.
- Render model state and transcript updates.
- Keep a recoverable transcript buffer.

### AudioWorklet responsibilities

- Receive microphone samples from the audio graph.
- Convert/interleave audio into the recognizer's required mono Float32 format.
- Resample only if the browser sample rate differs from the selected model sample rate.
- Emit bounded frame batches to reduce message overhead.
- Never retain audio after frames are delivered.

Do not perform inference in the AudioWorklet; its real-time thread must remain lightweight.

### Worker responsibilities

- Load sherpa-onnx runtime and model assets.
- Construct one online recognizer per active session.
- Accept PCM frame messages.
- Feed samples to the recognizer stream.
- Decode at a controlled cadence.
- Emit interim transcript changes.
- Detect endpoint/utterance completion through supported recognizer settings.
- Reset the stream after committing a stable segment.
- Finalize and dispose the recognizer on stop.

### Worker message contract

```ts
export type VoiceWorkerCommand =
  | { type: "LOAD_MODEL"; manifest: SpeechModelManifest }
  | { type: "START_SESSION"; sessionId: string }
  | { type: "PUSH_AUDIO"; sessionId: string; samples: Float32Array }
  | { type: "PAUSE_SESSION"; sessionId: string }
  | { type: "RESUME_SESSION"; sessionId: string }
  | { type: "FINALIZE_SESSION"; sessionId: string }
  | { type: "DISPOSE" };

export type VoiceWorkerEvent =
  | { type: "MODEL_PROGRESS"; loaded: number; total?: number }
  | { type: "MODEL_READY"; modelId: string }
  | { type: "INTERIM_RESULT"; sessionId: string; text: string }
  | { type: "COMMITTED_SEGMENT"; sessionId: string; segmentId: string; text: string }
  | { type: "SESSION_FINALIZED"; sessionId: string; finalText: string }
  | { type: "ERROR"; code: VoiceErrorCode; recoverable: boolean; message: string };
```

### Transcript state model

```ts
interface TranscriptState {
  sessionId: string;
  segments: TranscriptSegment[];
  interimText: string;
  manuallyEditedText?: string;
  revision: number;
}

interface TranscriptSegment {
  id: string;
  text: string;
  committedAt: number;
}
```

Once the user manually edits the merged transcript, either maintain a clear “resume appends here” model or convert the edit into a new canonical transcript revision. Avoid attempting fragile word-level reconciliation between arbitrary edits and continuing interim recognition.

## 4. Model assets and caching

Define a checked-in model manifest rather than scattering URLs throughout components.

```ts
interface SpeechModelManifest {
  id: string;
  label: string;
  languageTags: string[];
  sampleRate: number;
  files: Array<{
    role: "encoder" | "decoder" | "joiner" | "tokens" | "runtime";
    url: string;
    sha256?: string;
    bytes?: number;
  }>;
  estimatedMemoryMb: number;
  version: string;
}
```

Requirements:

- Serve assets from a stable same-origin/CDN path with correct MIME types.
- Use immutable versioned filenames.
- Cache model files with a service worker or browser cache strategy after validation.
- Expose model size before download when known.
- Do not silently download several language models.
- Keep a model compatibility matrix in documentation/tests.

## 5. AI compilation boundary

Replace the current prompt-to-unvalidated-array behavior with a versioned endpoint:

```text
POST /api/plan/compile
```

Request:

```ts
interface CompilePlanRequest {
  schemaVersion: 1;
  transcript: string;
  locale: string;
  timezone: string;
  planningDate: string; // YYYY-MM-DD
  preferences: PlanningPreferences;
  existingTasks?: ExistingTaskSummary[];
}
```

Response:

```ts
interface CompilePlanResponse {
  schemaVersion: 1;
  sourceTranscript: string;
  tasks: TaskProposal[];
  warnings: PlanWarning[];
  assumptions: PlanAssumption[];
  workload: WorkloadSummary;
}
```

The route should:

1. authenticate/rate-limit when user accounts exist; until then apply IP/session limits where practical;
2. validate the request;
3. call an AI provider through an adapter;
4. request schema-constrained structured output when supported;
5. validate with Zod;
6. reject or repair malformed output in a bounded way;
7. normalize enums and dates;
8. run deterministic schedule/conflict logic;
9. return proposals, never persisted tasks.

## 6. Provider abstraction

The repository currently imports Gemini directly inside route files. Introduce a narrow provider interface so model upgrades do not leak into product logic.

```ts
interface PlanningAIProvider {
  compileDailyPlan(input: CompilePlanInput): Promise<UntrustedPlanOutput>;
}
```

Provider adapters are responsible for SDK syntax. Domain code owns schemas, normalization, scheduling, and XP.

Environment configuration should include provider and model identifiers. Avoid hard-coding an old model name in the route.

## 7. Prompt design

The system prompt must state:

- transcript content is untrusted user data;
- preserve explicit constraints exactly;
- do not invent obligations, people, deadlines, or calendar events;
- estimate only missing duration/energy/timing fields;
- output only the requested schema;
- prefer actionable but minimal subtasks;
- expose uncertainty and assumptions;
- do not calculate final XP.

Wrap transcript data in a dedicated structured field, not string interpolation inside instructions.

## 8. Deterministic scheduling pass

Do not let the model be the sole scheduling authority. Use the model for semantic extraction and rough recommendations, then apply code-level rules.

Suggested pipeline:

1. Normalize all explicit date/time constraints.
2. Lock explicit exact times and durations.
3. Build dependency edges.
4. Detect impossible/conflicting constraints.
5. Determine available planning windows from preferences/defaults.
6. Rank unscheduled tasks by deadline, priority, dependency, and energy fit.
7. Place tasks conservatively with transition/buffer time.
8. Leave tasks unscheduled when no credible slot exists.
9. Produce warnings and deferral suggestions.

M1 does not need an optimal solver. A deterministic greedy scheduler with tests is safer than opaque model-only placement.

## 9. Persistence boundary

Create a repository abstraction even while storage remains local:

```ts
interface TaskJarRepository {
  loadState(): Promise<PersistedTaskJarState>;
  saveState(state: PersistedTaskJarState): Promise<void>;
  migrate(raw: unknown): PersistedTaskJarState;
}
```

For M1, a `LocalStorageTaskJarRepository` can implement it. This prepares the codebase for IndexedDB or cloud sync without coupling components to storage calls.

Because speech models may consume significant browser memory, task data should remain lightweight. Raw audio must never enter persisted state.

## 10. State ownership

Use a reducer or explicit state machine for voice sessions. Avoid many loosely related booleans such as `isRecording`, `isLoading`, `isPaused`, `isFinalizing` that can enter impossible combinations.

Suggested states:

```text
unsupported
idle
loadingModel
ready
requestingPermission
listening
paused
finalizing
reviewingTranscript
compilingPlan
reviewingPlan
error
```

Events should define valid transitions and cleanup behavior.

## 11. Error taxonomy

```ts
type VoiceErrorCode =
  | "UNSUPPORTED_BROWSER"
  | "MIC_PERMISSION_DENIED"
  | "MIC_DEVICE_MISSING"
  | "MODEL_DOWNLOAD_FAILED"
  | "MODEL_INTEGRITY_FAILED"
  | "MODEL_LOAD_FAILED"
  | "WORKER_CRASHED"
  | "AUDIO_PIPELINE_FAILED"
  | "RECOGNIZER_FAILED";

type PlanningErrorCode =
  | "TRANSCRIPT_TOO_SHORT"
  | "TRANSCRIPT_TOO_LARGE"
  | "RATE_LIMITED"
  | "AI_PROVIDER_FAILED"
  | "AI_OUTPUT_INVALID"
  | "SCHEDULING_CONFLICT";
```

UI errors should be actionable and preserve transcript/task proposal state.

## 12. Performance budgets

Initial targets to validate on supported devices:

- Voice controls respond within 100 ms of interaction, excluding permission UI.
- Interim transcript rendering does not exceed roughly 5–10 UI updates per second.
- Recognition never runs on the React main thread.
- No unbounded PCM queue; apply backpressure or drop with an explicit error rather than exhausting memory.
- Repeated start/stop cycles do not leak workers, streams, audio nodes, or model instances.
- Model assets are cached after first successful load.

Actual real-time factor and memory budgets must be measured per selected model/device matrix before declaring support.

## 13. Security and privacy notes

- Keep AI secrets server-side.
- Do not log transcripts in production request logs.
- Strip transcript content from client error telemetry.
- Apply Content Security Policy compatible with worker/WASM loading.
- Validate model asset origins and versions.
- Treat model-generated URLs, people, dates, and instructions as plain data.
- Escape all rendered user/model text through React; never use unsafe HTML.

## 14. Deployment considerations

- Confirm hosting supports large static model assets and byte-range/caching requirements.
- Configure correct headers for WASM.
- If threaded WASM is selected later, cross-origin isolation headers may be required; verify impact before adopting it.
- Keep a non-threaded baseline if deployment constraints make isolation impractical.
- Add a lightweight capability diagnostic page or developer panel for browser, WASM, worker, sample-rate, and model information.
