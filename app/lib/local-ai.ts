import type { LocalModelId } from "../types"

export interface LocalModelProfile {
  id: LocalModelId
  name: string
  shortName: string
  sizeMB: number
  fileName: string
  url: string
  description: string
  recommendedFor: string
}

export const LOCAL_MODELS: LocalModelProfile[] = [
  { id: "gemma-270m", name: "Gemma 3 270M Q4 Web", shortName: "Lite", sizeMB: 249, fileName: "gemma3-270m-it-q4_0-web.task", url: "https://huggingface.co/litert-community/gemma-3-270m-it/resolve/main/gemma3-270m-it-q4_0-web.task", description: "Fastest download and lowest memory use. Best for turning clear brain dumps into task lists.", recommendedFor: "Most phones and laptops" },
  { id: "gemma-1b", name: "Gemma 3 1B Q4 Web", shortName: "Quality", sizeMB: 776, fileName: "gemma3-1b-it-q4_0-web.task", url: "https://huggingface.co/litert-community/Gemma3-1B-IT/resolve/main/gemma3-1b-it-q4_0-web.task", description: "Better instruction following and weekly organisation while remaining below 1 GB.", recommendedFor: "Modern laptops with WebGPU" },
]

const MODEL_CACHE = "taskjar-local-models-v1"
const MODEL_KEY_PREFIX = "/__taskjar_local_model__/"
const MEDIAPIPE_MODULE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai"
const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm"

interface LlmRuntime { generateResponse: (prompt: string) => Promise<string>; close?: () => void }
interface GenAiModule {
  FilesetResolver: { forGenAiTasks: (wasmRoot: string) => Promise<unknown> }
  LlmInference: { createFromOptions: (fileset: unknown, options: { baseOptions: { modelAssetBuffer: ReadableStreamDefaultReader<Uint8Array> }; maxTokens: number; topK: number; temperature: number; randomSeed: number }) => Promise<LlmRuntime> }
}

let activeRuntime: { modelId: LocalModelId; runtime: LlmRuntime } | null = null
let modulePromise: Promise<GenAiModule> | null = null

function assertBrowser(): void { if (typeof window === "undefined") throw new Error("Local AI is available only in the browser.") }
function cacheKey(modelId: LocalModelId): string { return `${MODEL_KEY_PREFIX}${modelId}` }
async function getCache(): Promise<Cache> { assertBrowser(); if (!("caches" in window)) throw new Error("This browser does not support local model storage."); return caches.open(MODEL_CACHE) }
async function loadGenAiModule(): Promise<GenAiModule> {
  if (!modulePromise) {
    const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<GenAiModule>
    modulePromise = dynamicImport(MEDIAPIPE_MODULE_URL)
  }
  return modulePromise
}

export function getModelProfile(modelId: LocalModelId): LocalModelProfile { return LOCAL_MODELS.find((model) => model.id === modelId) ?? LOCAL_MODELS[0] }
export function hasWebGpu(): boolean { return typeof navigator !== "undefined" && "gpu" in navigator }
export async function isModelInstalled(modelId: LocalModelId): Promise<boolean> { try { const cache = await getCache(); return Boolean(await cache.match(cacheKey(modelId))) } catch { return false } }
export async function getInstalledModelIds(): Promise<LocalModelId[]> {
  const results = await Promise.all(LOCAL_MODELS.map(async (model) => ((await isModelInstalled(model.id)) ? model.id : null)))
  return results.filter((value): value is LocalModelId => Boolean(value))
}

export async function installModelFromUrl(modelId: LocalModelId, onProgress?: (progress: number | null) => void): Promise<void> {
  assertBrowser()
  const model = getModelProfile(modelId)
  const response = await fetch(model.url, { mode: "cors", credentials: "omit" })
  if (!response.ok || !response.body) throw new Error(response.status === 401 || response.status === 403 ? "Accept the Gemma licence on Hugging Face, download the .task file, then use Import model file." : `Model download failed (${response.status}). Import the .task file instead.`)
  const total = Number(response.headers.get("content-length") || 0)
  const [cacheStream, progressStream] = response.body.tee()
  const cache = await getCache()
  const progressTask = (async () => { const reader = progressStream.getReader(); let loaded = 0; while (true) { const { done, value } = await reader.read(); if (done) break; loaded += value.byteLength; onProgress?.(total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : null) } })()
  const headers = new Headers(response.headers); headers.set("content-type", "application/octet-stream")
  await Promise.all([cache.put(cacheKey(modelId), new Response(cacheStream, { status: 200, headers })), progressTask])
  localStorage.setItem(`taskjar_model_filename_${modelId}`, model.fileName)
  onProgress?.(100)
}

export async function installModelFromFile(modelId: LocalModelId, file: File): Promise<void> {
  assertBrowser()
  if (!file.name.endsWith(".task") && !file.name.endsWith(".litertlm")) throw new Error("Choose a MediaPipe/LiteRT .task or .litertlm model file.")
  const cache = await getCache()
  await cache.put(cacheKey(modelId), new Response(file, { status: 200, headers: { "content-type": "application/octet-stream", "content-length": String(file.size) } }))
  localStorage.setItem(`taskjar_model_filename_${modelId}`, file.name)
}

export async function removeModel(modelId: LocalModelId): Promise<void> {
  const cache = await getCache(); await cache.delete(cacheKey(modelId)); localStorage.removeItem(`taskjar_model_filename_${modelId}`)
  if (activeRuntime?.modelId === modelId) { activeRuntime.runtime.close?.(); activeRuntime = null }
}

async function loadRuntime(modelId: LocalModelId): Promise<LlmRuntime> {
  if (activeRuntime?.modelId === modelId) return activeRuntime.runtime
  if (!hasWebGpu()) throw new Error("WebGPU is unavailable. TaskJar will use its offline rules fallback.")
  const cache = await getCache(); const response = await cache.match(cacheKey(modelId))
  if (!response?.body) throw new Error("The selected local model is not installed.")
  activeRuntime?.runtime.close?.(); activeRuntime = null
  const { FilesetResolver, LlmInference } = await loadGenAiModule()
  const fileset = await FilesetResolver.forGenAiTasks(MEDIAPIPE_WASM_URL)
  const runtime = await LlmInference.createFromOptions(fileset, { baseOptions: { modelAssetBuffer: response.body.getReader() }, maxTokens: 1024, topK: 20, temperature: 0.2, randomSeed: 42 })
  activeRuntime = { modelId, runtime }
  return runtime
}

export async function generateOnDevice(modelId: LocalModelId, prompt: string): Promise<{ text: string; modelName: string }> {
  const profile = getModelProfile(modelId)
  const runtime = await loadRuntime(modelId)
  const text = await runtime.generateResponse(`<start_of_turn>user\n${prompt}<end_of_turn>\n<start_of_turn>model\n`)
  return { text, modelName: profile.name }
}
