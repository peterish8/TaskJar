"use client"

import { ArrowDown, ArrowUp, Plus, RefreshCcw, Trash2, X } from "lucide-react"
import type { Difficulty, GeneratedTask, Priority, Subtask } from "../types"

const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

export default function PlanReviewModal({ drafts, onChange, warnings, transcript, onAccept, onRegenerate, onRegenerateTask, onClose }: {
  drafts: GeneratedTask[]
  onChange: (drafts: GeneratedTask[]) => void
  warnings: string[]
  transcript: string
  onAccept: () => void
  onRegenerate: () => void
  onRegenerateTask: (index: number) => void
  onClose: () => void
}) {
  const selectedCount = drafts.filter((task) => task.selected !== false).length
  const update = (index: number, patch: Partial<GeneratedTask>) => onChange(drafts.map((task, itemIndex) => itemIndex === index ? { ...task, ...patch } : task))
  const updateSubtask = (taskIndex: number, subtaskIndex: number, patch: Partial<Subtask>) => {
    const subtasks = [...(drafts[taskIndex].subtasks || [])]
    subtasks[subtaskIndex] = { ...subtasks[subtaskIndex], ...patch }
    update(taskIndex, { subtasks })
  }
  const moveSubtask = (taskIndex: number, from: number, to: number) => {
    if (to < 0 || to >= (drafts[taskIndex].subtasks || []).length) return
    const subtasks = [...(drafts[taskIndex].subtasks || [])]
    const [item] = subtasks.splice(from, 1)
    subtasks.splice(to, 0, item)
    update(taskIndex, { subtasks })
  }

  return <div className="modal" role="dialog" aria-modal="true" aria-labelledby="plan-review-title">
    <div className="plan-review">
      <div className="modal-heading">
        <div><p className="eyebrow">REVIEW BEFORE SAVING</p><h2 id="plan-review-title">Your proposed plan</h2><p className="muted">Nothing enters TaskJar until you accept it.</p></div>
        <button className="icon quiet" onClick={onClose} aria-label="Close plan review"><X/></button>
      </div>

      {warnings.length > 0 && <section className="warning-box"><b>Planning notes</b>{warnings.map((warning) => <p key={warning}>• {warning}</p>)}</section>}

      <div className="selection-bar">
        <b>{selectedCount} of {drafts.length} selected</b>
        <div className="actions"><button className="quiet" onClick={() => onChange(drafts.map((task) => ({ ...task, selected: true })))}>Select all</button><button className="quiet" onClick={() => onChange(drafts.map((task) => ({ ...task, selected: false })))}>Select none</button></div>
      </div>

      <div className="review-list">
        {drafts.map((task, index) => <article key={task.clientId || index} className={`review-task ${task.selected === false ? "excluded" : ""}`}>
          <div className="review-task-top"><label className="select-task"><input type="checkbox" checked={task.selected !== false} onChange={(event) => update(index, { selected: event.target.checked })}/><span>Include task</span></label><button className="quiet" onClick={() => onRegenerateTask(index)}><RefreshCcw/> Regenerate task</button></div>
          <div className="review-grid">
            <label className="wide">Title<input value={task.name} onChange={(event) => update(index, { name: event.target.value })}/></label>
            <label className="wide">Description<textarea value={task.description} onChange={(event) => update(index, { description: event.target.value })}/></label>
            <label>Priority<select value={task.priority} onChange={(event) => update(index, { priority: event.target.value as Priority })}><option value="urgent">Urgent</option><option value="scheduled">Scheduled</option><option value="optional">Optional</option></select></label>
            <label>Difficulty<select value={task.difficulty} onChange={(event) => update(index, { difficulty: event.target.value as Difficulty })}><option value="light">Light</option><option value="standard">Standard</option><option value="challenging">Challenging</option></select></label>
            <label>Energy<select value={task.energy || "medium"} onChange={(event) => update(index, { energy: event.target.value as GeneratedTask["energy"] })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
            <label>Minutes<input type="number" min="5" max="480" step="5" value={task.estimatedMinutes || 30} onChange={(event) => update(index, { estimatedMinutes: Number(event.target.value) })}/></label>
            <label>Date<input type="date" value={task.scheduledFor || ""} onChange={(event) => update(index, { scheduledFor: event.target.value || undefined })}/></label>
            <label>Suggested time<input type="time" value={task.suggestedStartTime || ""} onChange={(event) => update(index, { suggestedStartTime: event.target.value || undefined, timingConstraintSource: event.target.value ? task.timingConstraintSource || "inferred" : "none" })}/></label>
          </div>
          <div className="explain"><b>{task.timingConstraintSource || "none"} timing</b><span>{task.timingReason}</span>{task.sourceExcerpt && <small>From: “{task.sourceExcerpt}”</small>}</div>
          {(task.warnings || []).map((warning) => <p className="task-warning" key={warning}>⚠ {warning}</p>)}
          <div className="subtask-editor">
            <div className="subtask-heading"><b>Subtasks</b><button className="quiet" onClick={() => update(index, { subtasks: [...(task.subtasks || []), { id: uid(), title: "", completed: false, estimatedMinutes: 10 }] })} disabled={(task.subtasks || []).length >= 5}><Plus/> Add</button></div>
            {(task.subtasks || []).map((subtask, subtaskIndex) => <div className="subtask-edit" key={subtask.id}>
              <input value={subtask.title} placeholder="Clear next step" onChange={(event) => updateSubtask(index, subtaskIndex, { title: event.target.value })}/>
              <input className="minutes" type="number" min="1" max="240" value={subtask.estimatedMinutes || ""} placeholder="min" onChange={(event) => updateSubtask(index, subtaskIndex, { estimatedMinutes: Number(event.target.value) || undefined })}/>
              <button className="icon quiet" onClick={() => moveSubtask(index, subtaskIndex, subtaskIndex - 1)} aria-label="Move subtask up"><ArrowUp/></button>
              <button className="icon quiet" onClick={() => moveSubtask(index, subtaskIndex, subtaskIndex + 1)} aria-label="Move subtask down"><ArrowDown/></button>
              <button className="icon danger" onClick={() => update(index, { subtasks: (task.subtasks || []).filter((_, itemIndex) => itemIndex !== subtaskIndex) })} aria-label="Delete subtask"><Trash2/></button>
            </div>)}
          </div>
        </article>)}
      </div>

      <details><summary>Transcript used for this plan</summary><p className="transcript-preview">{transcript}</p></details>
      <div className="modal-actions"><button className="quiet" onClick={onRegenerate}><RefreshCcw/> Regenerate</button><button disabled={!selectedCount} onClick={onAccept}><Plus/> Add {selectedCount} selected task{selectedCount === 1 ? "" : "s"}</button></div>
    </div>
  </div>
}
