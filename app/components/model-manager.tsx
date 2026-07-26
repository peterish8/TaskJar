"use client"
import { useEffect, useState } from "react"
import { Check, Download, Trash2, Upload } from "lucide-react"
import type { LocalModelId } from "../types"
import { LOCAL_MODELS, getInstalledModelIds, hasWebGpu, installModelFromFile, installModelFromUrl, removeModel } from "../lib/local-ai"

export default function ModelManager({ selected, onSelect, onNotice }: { selected: LocalModelId; onSelect: (id: LocalModelId) => void; onNotice: (value: string) => void }) {
  const [installed, setInstalled] = useState<LocalModelId[]>([])
  const [progress, setProgress] = useState<Record<string, number | null>>({})
  const refresh = () => getInstalledModelIds().then(setInstalled)
  useEffect(() => { refresh() }, [])
  return <section className="card"><h2>Local AI models</h2><p className="muted">Cached only in this browser. WebGPU: {hasWebGpu() ? "available" : "unavailable; rules fallback remains usable"}.</p><div className="model-grid">{LOCAL_MODELS.map(model => {
    const ready = installed.includes(model.id)
    return <article key={model.id} className={selected === model.id ? "model selected" : "model"}><h3>{model.shortName}: {model.name}</h3><b>~{model.sizeMB} MB</b><p className="muted">{model.description}</p>{typeof progress[model.id] === "number" && progress[model.id]! < 100 && <progress value={progress[model.id] || 0} max="100"/>}<div className="actions"><button className="quiet" onClick={() => onSelect(model.id)}>{selected === model.id && <Check size={15}/>} Select</button>{ready ? <button className="danger" onClick={async () => { await removeModel(model.id); refresh() }}><Trash2 size={15}/> Remove</button> : <><button onClick={async () => { try { await installModelFromUrl(model.id, value => setProgress(p => ({...p,[model.id]:value}))); await refresh(); onNotice(`${model.name} installed locally.`) } catch (error) { onNotice(error instanceof Error ? error.message : "Download failed") } }}><Download size={15}/> Download</button><label className="quiet file"><Upload size={15}/> Import<input type="file" accept=".task,.litertlm" onChange={async e => { const file=e.target.files?.[0]; if(!file)return; try { await installModelFromFile(model.id,file); await refresh(); onNotice(`${file.name} imported.`) } catch(error){onNotice(error instanceof Error?error.message:"Import failed")} }}/></label></>}</div></article>
  })}</div></section>
}
