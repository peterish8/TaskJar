const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"
let transcriber = null
let loading = null
let queue = Promise.resolve()

async function ensureModel() {
  if (transcriber) return transcriber
  if (!loading) {
    loading = (async () => {
      const { pipeline, env } = await import(TRANSFORMERS_URL)
      env.allowLocalModels = false
      env.useBrowserCache = true
      const useWebGpu = "gpu" in self.navigator
      transcriber = await pipeline("automatic-speech-recognition", "onnx-community/whisper-tiny.en", {
        device: useWebGpu ? "webgpu" : "wasm",
        dtype: useWebGpu ? "fp16" : "q8",
        progress_callback: (progress) => {
          const value = typeof progress?.progress === "number" ? Math.round(progress.progress) : null
          self.postMessage({ type: "MODEL_PROGRESS", progress: value })
        },
      })
      self.postMessage({ type: "READY", device: useWebGpu ? "webgpu" : "wasm" })
      return transcriber
    })().catch((error) => {
      loading = null
      self.postMessage({ type: "ERROR", code: "MODEL_LOAD_ERROR", message: error?.message || "Speech model failed to load." })
      throw error
    })
  }
  return loading
}

self.onmessage = (event) => {
  const message = event.data
  if (message.type === "INIT") {
    void ensureModel()
    return
  }
  if (message.type === "RESET") return
  if (message.type === "TERMINATE") {
    transcriber?.dispose?.()
    self.close()
    return
  }
  if (message.type !== "TRANSCRIBE") return
  queue = queue.then(async () => {
    const pipe = await ensureModel()
    const samples = new Float32Array(message.samples)
    if (samples.length < 4000) {
      self.postMessage({ type: "RESULT", sequence: message.sequence, text: "", final: message.final })
      return
    }
    const result = await pipe(samples, { language: "en", task: "transcribe" })
    self.postMessage({ type: "RESULT", sequence: message.sequence, text: String(result?.text || "").trim(), final: Boolean(message.final) })
  }).catch((error) => self.postMessage({ type: "ERROR", code: "TRANSCRIPTION_ERROR", message: error?.message || "Speech transcription failed." }))
}

