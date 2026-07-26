"use client"

import type { CSSProperties } from "react"
import { Keyboard, Loader2, Mic, Pause, Play, RotateCcw, Square, Trash2, WandSparkles } from "lucide-react"
import { useVoiceCapture } from "../hooks/use-voice-capture"

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export default function VoiceCaptureCard({ transcript, onTranscriptChange, onMakePlan, busy, onVoiceUsed, languageTag, hasAcknowledgedDisclosure, onAcknowledgeDisclosure }: {
  transcript: string
  onTranscriptChange: (value: string) => void
  onMakePlan: () => void
  busy: boolean
  onVoiceUsed?: () => void
  languageTag: string
  hasAcknowledgedDisclosure: boolean
  onAcknowledgeDisclosure: () => void
}) {
  const capture = useVoiceCapture(transcript, onTranscriptChange)
  const active = capture.state === "recording" || capture.state === "paused"
  const stopped = capture.state === "stopped" || Boolean(transcript.trim())
  const loading = ["requesting-permission", "loading-model"].includes(capture.state)

  const startVoice = async () => {
    if (!hasAcknowledgedDisclosure) {
      const accepted = confirm(`TaskJar will download and cache an English speech model in this browser. Raw microphone audio stays local and is never uploaded. Continue with language: ${languageTag === "en" ? "English" : languageTag}?`)
      if (!accepted) return
      onAcknowledgeDisclosure()
    }
    onVoiceUsed?.()
    await capture.start()
  }
  const undoLastSegment = () => {
    const trimmed = transcript.trim()
    if (!trimmed) return
    const sentences = trimmed.match(/[^.!?]+[.!?]?/g) || []
    if (sentences.length > 1) onTranscriptChange(sentences.slice(0, -1).join("").trim())
    else onTranscriptChange(trimmed.split(/\s+/).slice(0, -Math.min(10, trimmed.split(/\s+/).length)).join(" "))
  }
  const cleanTranscript = () => {
    const cleaned = transcript.replace(/\s+/g, " ").replace(/\s+([,.!?])/g, "$1").trim()
    onTranscriptChange(cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "")
  }

  return <section className="card voice-card" aria-labelledby="voice-planner-title">
    <div className="voice-heading">
      <div>
        <p className="eyebrow">VOICE-FIRST · PRIVATE</p>
        <h2 id="voice-planner-title">Speak your day naturally</h2>
        <p className="muted">Audio is converted to text inside this browser with a cached Whisper model. Raw microphone audio is not uploaded.</p>
      </div>
      <div className={`mic-orb ${active ? "listening" : ""}`} style={{ "--voice-level": capture.level } as CSSProperties} aria-hidden="true"><Mic/></div>
    </div>

    <div className="voice-status" aria-live="polite">
      <b>{capture.state.replaceAll("-", " ")}</b>
      {active && <span>{formatTime(capture.elapsedSeconds)} / {formatTime(capture.maxSeconds)}</span>}
      {capture.state === "loading-model" && <span>{capture.modelProgress === null ? "Downloading speech model…" : `${capture.modelProgress}%`}</span>}
    </div>

    {capture.error && <p className="error-banner">{capture.error}</p>}

    <div className="voice-actions">
      {!active && !loading && <button onClick={() => void startVoice()}><Mic/> {transcript ? "Record more" : "Speak my day"}</button>}
      {loading && <button disabled><Loader2 className="spin"/> Preparing local speech</button>}
      {capture.state === "recording" && <button className="quiet" onClick={capture.pause}><Pause/> Pause</button>}
      {capture.state === "paused" && <button onClick={capture.resume}><Play/> Resume</button>}
      {active && <button className="quiet" onClick={capture.stop}><Square/> Stop</button>}
      {(active || stopped) && <button className="danger" onClick={() => { if (!transcript.trim() || confirm("Discard this transcript?")) void capture.discard() }}><Trash2/> Discard</button>}
    </div>

    <label className="transcript-label"><Keyboard size={17}/> Editable transcript</label>
    <textarea
      value={transcript}
      onChange={(event) => onTranscriptChange(event.target.value)}
      placeholder="Speak, or type instead: finish DBMS assignment, call Amma in the evening, revise React hooks…"
      aria-describedby="transcript-help"
    />
    {capture.partial && <p className="partial-transcript">{capture.partial}</p>}
    <p id="transcript-help" className="muted compact">Correct names, times, and recognition mistakes before making the plan.</p>

    <div className="voice-footer">
      <button className="quiet" disabled={!transcript.trim() || busy} onClick={undoLastSegment}><RotateCcw/> Undo last segment</button><button className="quiet" disabled={!transcript.trim() || busy} onClick={cleanTranscript}><Keyboard/> Clean transcript</button>
      <button disabled={!transcript.trim() || active || loading || busy} onClick={onMakePlan}>{busy ? <Loader2 className="spin"/> : <WandSparkles/>} Make my plan</button>
    </div>
  </section>
}

