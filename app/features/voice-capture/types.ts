export type VoiceCaptureState =
  | "idle"
  | "requesting-permission"
  | "loading-model"
  | "ready"
  | "recording"
  | "paused"
  | "stopped"
  | "generating-plan"
  | "permission-denied"
  | "unsupported-browser"
  | "model-load-error"
  | "microphone-error"

export interface VoiceCaptureSnapshot {
  state: VoiceCaptureState
  transcript: string
  partial: string
  elapsedSeconds: number
  modelProgress: number | null
  level: number
  error: string
}
