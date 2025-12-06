"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { Task, AppSettings } from "../types"

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onAddTask: (task: Omit<Task, "id" | "completed" | "completedAt">) => void
  settings: AppSettings
}

export default function AddTaskModal({ isOpen, onClose, onAddTask, settings }: AddTaskModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"optional" | "scheduled" | "urgent">("optional")
  const [difficulty, setDifficulty] = useState<"light" | "standard" | "challenging">("standard")

  const handleSubmit = () => {
    if (!name.trim()) return

    const newTask: Omit<Task, "id" | "completed" | "completedAt"> = {
      name,
      description,
      priority,
      difficulty,
      xpValue: settings.xpValues[difficulty],
      priorityEmoji: settings.emojis.priority[priority],
      difficultyEmoji: settings.emojis.difficulty[difficulty],
      createdAt: Date.now(),
    }
    onAddTask(newTask)
    onClose()
    // Reset form
    setName("")
    setDescription("")
    setPriority("optional")
    setDifficulty("standard")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white w-[90vw] max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>Add a New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-1">
          <div className="space-y-2">
            <Label htmlFor="task-name" className="pl-1">Task Name</Label>
            <Input id="task-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter task name" className="bg-white/10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description" className="pl-1">Description (Optional)</Label>
            <Textarea id="task-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a description" className="bg-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-priority" className="pl-1">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger id="task-priority" className="bg-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="optional">{settings.emojis.priority.optional} Optional</SelectItem>
                  <SelectItem value="scheduled">{settings.emojis.priority.scheduled} Scheduled</SelectItem>
                  <SelectItem value="urgent">{settings.emojis.priority.urgent} Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-difficulty" className="pl-1">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                <SelectTrigger id="task-difficulty" className="bg-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{settings.emojis.difficulty.light} Light</SelectItem>
                  <SelectItem value="standard">{settings.emojis.difficulty.standard} Standard</SelectItem>
                  <SelectItem value="challenging">{settings.emojis.difficulty.challenging} Challenging</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 spotify-button">Add Task</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}