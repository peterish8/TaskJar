# TaskJar Local

TaskJar is a private, local-first task planner. It has no authentication flow, no cloud database, and no server-side AI dependency.

## What changed

- Landing page opens the dashboard directly.
- Tasks, settings, jar progress, and model preferences use browser storage.
- Daily planning includes overdue carry-over tasks.
- Weekly dumps use exact `yyyy-MM-dd` dates, so tasks appear on the correct day.
- AI can run in the browser through MediaPipe Tasks GenAI and WebGPU.
- Two optional quantised model profiles are available: Gemma 3 270M Q4 (~249 MB) and Gemma 3 1B Q4 (~776 MB).
- A deterministic offline rules planner works even without a downloaded model or WebGPU.
- The complete task journey exports as a clean Markdown file for Hermes, Claude, ChatGPT, Codex, or another agent.

## Local AI setup

Open **Settings → Local AI models**. Select a model and either download it or import a compatible `.task` / `.litertlm` file. Some Hugging Face files may require accepting the Gemma licence before manual download.

Model files are stored with the browser Cache API. Task data remains in `localStorage`.

## Development

```bash
pnpm install
pnpm dev
```

Then open the local Next.js URL shown in the terminal.

## Privacy model

TaskJar does not require an account. The removed API routes no longer send prompts to Gemini. Clearing browser site data removes TaskJar data and downloaded model caches for that browser profile.
