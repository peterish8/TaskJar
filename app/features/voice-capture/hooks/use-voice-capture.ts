"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { VoiceCaptureSnapshot, VoiceCaptureState } from "../types"
import { cleanupTranscript, mergeTranscript } from "../lib/transcript-assembler"

const TARGET_SAMPLE_RATE = 16_000
const CHUNK_SECONDS = 3
const MAX_CAPTURE_SECONDS = 10 * 60

function resample(input: Float32Array, sourceRate: number): Float32Array {
  if (sourceRate === TARGET_SAMPLE_RATE) return input
  const ratio = sourceRate / TARGET_SAMPLE_RATE
  const output = new Float32Array(Math.max(1, Math.floor(input.length / ratio)))
  for (let i = 0; i < output.length; i += 1) {
    const start = Math.floor(i * ratio)
    const end = Math.min(input.length, Math.floor((i + 1) * ratio))
    let sum = 0
    for (let j = start; j < end; j += 1) sum += input[j]
    output[i] = sum / Math.max(1, end - start)
  }
  return output
}

function concat(chunks: Float32Array[]): Float32Array {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const output = new Float32Array(length)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }
  return output
}

export function useVoiceCapture(value: string, onChange: (value: string) => void) {
  const [snapshot, setSnapshot] = useState<VoiceCaptureSnapshot>({
    state: "idle",
    transcript: value,
    partial: "",
    elapsedSeconds: 0,
    modelProgress: null,
    level: 0,
    error: "",
  })
  const workerRef = useRef<Worker | null>(null)
  const workerReadyRef = useRef<Promise<void> | null>(null)
  const resolveWorkerRef = useRef<(() => void) | null>(null)
  const rejectWorkerRef = useRef<((error: Error) => void) | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const chunksRef = useRef<Float32Array[]>([])
  const overlapRef = useRef<Float32Array>(new Float32Array())
  const flushTimerRef = useRef<number | null>(null)
  const elapsedTimerRef = useRef<number | null>(null)
  const sequenceRef = useRef(0)
  const transcriptRef = useRef(value)
  const pendingPartialRef = useRef("")
  const stateRef = useRef<VoiceCaptureState>("idle")

  useEffect(() => {
    transcriptRef.current = value
    setSnapshot((current) => ({ ...current, transcript: value }))
  }, [value])

  const setState = useCallback((state: VoiceCaptureState, error = "") => {
    stateRef.current = state
    setSnapshot((current) => ({ ...current, state, error }))
  }, [])

  const stopTimers = useCallback(() => {
    if (flushTimerRef.current) window.clearInterval(flushTimerRef.current)
    if (elapsedTimerRef.current) window.clearInterval(elapsedTimerRef.current)
    flushTimerRef.current = null
    elapsedTimerRef.current = null
  }, [])

  const releaseAudio = useCallback(async () => {
    stopTimers()
    workletRef.current?.disconnect()
    sourceRef.current?.disconnect()
    gainRef.current?.disconnect()
    workletRef.current = null
    sourceRef.current = null
    gainRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    const context = contextRef.current
    contextRef.current = null
    if (context && context.state !== "closed") await context.close().catch(() => undefined)
    setSnapshot((current) => ({ ...current, level: 0 }))
  }, [stopTimers])

  const ensureWorker = useCallback(async () => {
    if (workerReadyRef.current) return workerReadyRef.current
    const worker = new Worker("/taskjar-voice-worker.js", { type: "module" })
    workerRef.current = worker
    workerReadyRef.current = new Promise<void>((resolve, reject) => {
      resolveWorkerRef.current = resolve
      rejectWorkerRef.current = reject
    })
    worker.onmessage = (event: MessageEvent) => {
      const message = event.data as { type: string; progress?: number | null; text?: string; message?: string; final?: boolean }
      if (message.type === "MODEL_PROGRESS") {
        setSnapshot((current) => ({ ...current, modelProgress: typeof message.progress === "number" ? message.progress : null }))
      } else if (message.type === "READY") {
        resolveWorkerRef.current?.()
        setSnapshot((current) => ({ ...current, modelProgress: 100 }))
      } else if (message.type === "RESULT") {
        const text = String(message.text || "").trim()
        if (message.final) {
          let merged = transcriptRef.current
          if (pendingPartialRef.current) merged = mergeTranscript(merged, pendingPartialRef.current)
          if (text) merged = mergeTranscript(merged, text)
          merged = cleanupTranscript(merged)
          pendingPartialRef.current = ""
          transcriptRef.current = merged
          onChange(merged)
          setSnapshot((current) => ({ ...current, transcript: merged, partial: "" }))
        } else if (text) {
          if (pendingPartialRef.current) {
            const committed = mergeTranscript(transcriptRef.current, pendingPartialRef.current)
            transcriptRef.current = committed
            onChange(committed)
          }
          pendingPartialRef.current = text
          setSnapshot((current) => ({ ...current, transcript: transcriptRef.current, partial: text }))
        }
      } else if (message.type === "ERROR") {
        const error = new Error(message.message || "Local speech recognition failed.")
        rejectWorkerRef.current?.(error)
        setState(stateRef.current === "loading-model" ? "model-load-error" : "microphone-error", error.message)
      }
    }
    worker.onerror = () => {
      const error = new Error("The local speech worker crashed. Retry or type instead.")
      rejectWorkerRef.current?.(error)
      setState("model-load-error", error.message)
    }
    worker.postMessage({ type: "INIT" })
    return workerReadyRef.current
  }, [onChange, setState])

  const flush = useCallback((final = false) => {
    if (!workerRef.current || !chunksRef.current.length) return
    const current = concat(chunksRef.current)
    chunksRef.current = []
    const withOverlap = overlapRef.current.length ? concat([overlapRef.current, current]) : current
    overlapRef.current = withOverlap.slice(Math.max(0, withOverlap.length - TARGET_SAMPLE_RATE / 2))
    sequenceRef.current += 1
    const samples = withOverlap
    setSnapshot((item) => ({ ...item, partial: final ? "Finishing transcript…" : "Transcribing latest speech…" }))
    workerRef.current.postMessage({ type: "TRANSCRIBE", sequence: sequenceRef.current, samples: samples.buffer, final }, [samples.buffer])
  }, [])

  const stop = useCallback(async () => {
    if (!["recording", "paused"].includes(stateRef.current)) return
    const hadBufferedAudio = chunksRef.current.length > 0
    flush(true)
    await releaseAudio()
    if (!hadBufferedAudio && pendingPartialRef.current) {
      const merged = cleanupTranscript(mergeTranscript(transcriptRef.current, pendingPartialRef.current))
      pendingPartialRef.current = ""
      transcriptRef.current = merged
      onChange(merged)
      setSnapshot((current) => ({ ...current, transcript: merged, partial: "" }))
    }
    setState("stopped")
  }, [flush, onChange, releaseAudio, setState])

  const start = useCallback(async () => {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!navigator.mediaDevices?.getUserMedia || !AudioContextCtor || !window.Worker) {
      setState("unsupported-browser", "This browser cannot run TaskJar voice capture. Type your plan instead.")
      return
    }
    try {
      setState("requesting-permission")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false })
      streamRef.current = stream
      setState("loading-model")
      await ensureWorker()
      const context = new AudioContextCtor()
      contextRef.current = context
      await context.audioWorklet.addModule("/taskjar-pcm-worklet.js")
      const source = context.createMediaStreamSource(stream)
      const worklet = new AudioWorkletNode(context, "taskjar-pcm-capture")
      const gain = context.createGain()
      gain.gain.value = 0
      source.connect(worklet)
      worklet.connect(gain)
      gain.connect(context.destination)
      sourceRef.current = source
      workletRef.current = worklet
      gainRef.current = gain
      chunksRef.current = []
      overlapRef.current = new Float32Array()
      worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
        if (stateRef.current !== "recording") return
        const raw = event.data
        let power = 0
        for (let i = 0; i < raw.length; i += 1) power += raw[i] * raw[i]
        const level = Math.min(1, Math.sqrt(power / Math.max(1, raw.length)) * 8)
        setSnapshot((current) => ({ ...current, level }))
        chunksRef.current.push(resample(raw, context.sampleRate))
      }
      setSnapshot((current) => ({ ...current, elapsedSeconds: 0, error: "" }))
      setState("recording")
      await context.resume()
      flushTimerRef.current = window.setInterval(() => flush(false), CHUNK_SECONDS * 1000)
      elapsedTimerRef.current = window.setInterval(() => {
        setSnapshot((current) => {
          const elapsedSeconds = current.elapsedSeconds + 1
          if (elapsedSeconds >= MAX_CAPTURE_SECONDS) void stop()
          return { ...current, elapsedSeconds }
        })
      }, 1000)
    } catch (error) {
      await releaseAudio()
      const message = error instanceof Error ? error.message : "Microphone access failed."
      if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError")) setState("permission-denied", "Microphone permission was denied. Enable it in browser settings or type instead.")
      else if (stateRef.current === "loading-model") setState("model-load-error", message)
      else setState("microphone-error", message)
    }
  }, [ensureWorker, flush, releaseAudio, setState, stop])

  const pause = useCallback(async () => {
    if (stateRef.current !== "recording") return
    await contextRef.current?.suspend()
    setState("paused")
  }, [setState])

  const resume = useCallback(async () => {
    if (stateRef.current !== "paused") return
    await contextRef.current?.resume()
    setState("recording")
  }, [setState])

  const discard = useCallback(async () => {
    await releaseAudio()
    chunksRef.current = []
    overlapRef.current = new Float32Array()
    pendingPartialRef.current = ""
    transcriptRef.current = ""
    onChange("")
    setSnapshot((current) => ({ ...current, transcript: "", partial: "", elapsedSeconds: 0, error: "" }))
    setState("idle")
    workerRef.current?.postMessage({ type: "RESET" })
  }, [onChange, releaseAudio, setState])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && stateRef.current === "recording") void pause()
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [pause])

  useEffect(() => () => {
    void releaseAudio()
    workerRef.current?.postMessage({ type: "TERMINATE" })
    workerRef.current?.terminate()
  }, [releaseAudio])

  return { ...snapshot, start, pause, resume, stop, discard, maxSeconds: MAX_CAPTURE_SECONDS }
}

