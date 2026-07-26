# TaskJar — Project Context

## Product

TaskJar is a local-first, gamified task planner that converts an unstructured description of a user's day or week into clear tasks and rewards completion with XP that fills collectible jars.

The next milestone changes the primary interaction from typing into a textarea to **speaking naturally about life and responsibilities**. While the user talks, TaskJar must display live subtitles locally in the browser. When the user finishes, the AI converts the final transcript into an editable, realistic plan containing tasks, recommended subtasks, estimated effort, energy level, and suggested timing.

## Core user promise

> Speak everything on your mind. TaskJar turns it into a plan you can actually finish.

The product must reduce planning effort without silently changing the user's intent or producing an unrealistic schedule.

## Current repository baseline

- Next.js App Router, TypeScript, React, Tailwind CSS, shadcn/Radix UI.
- Daily and weekly natural-language task generation already exists through server API routes.
- Tasks, jars, and settings are stored in browser `localStorage`.
- Existing task fields include priority, difficulty, XP, completion state, creation time, and an optional scheduled day.
- Completing a task grants XP to the active jar; reaching the jar target completes it and starts a new jar.
- The current daily and weekly inputs are textareas.

## Milestone M1: Voice-first daily planning

Deliver one production-quality vertical slice:

1. The browser loads an on-device sherpa-onnx WebAssembly speech model.
2. The user starts speaking from the Today screen.
3. Partial recognition results appear continuously as live subtitles.
4. Pauses create stable utterance segments without prematurely ending the session.
5. The user can stop, resume, edit, or clear the transcript.
6. The final transcript is sent as text—not audio—to TaskJar's AI task compiler.
7. The compiler produces structured tasks with subtasks, effort estimates, energy labels, explicit constraints, and suggested time windows.
8. The user reviews and edits the proposal before saving anything.
9. Accepted tasks enter the existing task list and continue using the jar/XP completion loop.

## Product principles

### Voice first, never voice only

Speech is the default path. Typed editing remains available for accessibility, unsupported browsers, noisy environments, and transcription corrections.

### Local audio privacy

Microphone audio and speech recognition stay in the browser for the sherpa-onnx path. Only the final text transcript may be sent to the AI task-generation route. Raw audio is not uploaded or persisted by default.

### User intent outranks AI inference

Explicit dates, deadlines, durations, and time-of-day statements are hard constraints. AI recommendations may fill missing information but must not override what the user said.

### Review before write

Generated tasks are proposals. No task, subtask, schedule, or duration is persisted until the user confirms it.

### Realistic plans over impressive plans

TaskJar should prefer a smaller achievable plan, surface overload, and move optional work rather than packing every task into one day.

### Gamification rewards completion, not task inflation

XP must be based on estimated effort and actual completion. Subtasks should not create unlimited XP or encourage artificial task splitting.

## Target users

- Students planning classes, assignments, learning, health, and personal commitments.
- Young professionals who think aloud more easily than they write plans.
- Users who feel overwhelmed by an unstructured mental list and need a clear starting point.

## Key scenarios

### Daily brain dump

"Today I need to finish the database assignment, call Amma after class, revise JavaScript, and maybe go to the gym in the evening. The assignment must be submitted before 8 PM."

TaskJar should identify hard constraints, separate commitments, recommend useful subtasks, estimate effort, and place cognitively heavy work earlier than low-energy work when possible.

### Vague large task

"I need to work on my portfolio."

TaskJar should preserve the main task while proposing a small actionable breakdown such as reviewing current content, selecting one section, making the change, and testing it.

### User-specified duration

"Spend only 30 minutes cleaning my room after dinner."

The 30-minute duration and after-dinner constraint must be preserved exactly. The AI must not expand it into a larger project.

## Fixed architectural decisions

- Browser STT engine: sherpa-onnx compiled for WebAssembly.
- Recognition work runs outside the React main thread.
- Microphone capture uses `getUserMedia`; low-level PCM delivery should use an `AudioWorklet` when practical.
- Recognition output is separated into interim and committed transcript segments.
- Task generation uses a versioned, validated JSON contract.
- Zod validates all AI output before it enters application state.
- Existing local data receives an explicit migration/version layer rather than ad-hoc field assumptions.
- AI provider/model selection is configuration-driven and must not be hard-coded into UI components.

## Non-goals for M1

- Storing raw voice recordings.
- Cloud speech recognition as the default path.
- Fully autonomous calendar booking.
- Medical or mental-health diagnosis from speech.
- Always-listening background capture.
- Multi-user collaboration.
- Native mobile background microphone behavior.

## Success measures

- A first-time user can begin speaking after microphone permission and model preparation without typing.
- Interim captions update perceptibly during speech rather than only after stopping.
- The UI remains responsive while recognition is active.
- The system never creates tasks before explicit confirmation.
- Every accepted task has a clear action title; large tasks include useful subtasks.
- Explicit timing constraints survive transcription, AI transformation, review, and persistence.
- Users can understand why a duration/time recommendation was made and edit it in one interaction.
- Existing task completion, XP, jar filling, history, and manual task creation continue to work.
