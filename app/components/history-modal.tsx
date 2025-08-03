"use client"

import { useState } from "react"
import { Trash2, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Task } from "../types"

interface HistoryModalProps {
  isOpen: boolean
  onClose: () => void
  tasks: Task[]
  onDeleteTask: (taskId: string) => void
  playSound: (type: "click" | "complete" | "generate") => void
}

export default function HistoryModal({ isOpen, onClose, tasks, onDeleteTask, playSound }: HistoryModalProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const completedTasks = tasks
    .filter((task) => task.completed)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))

  const handleDelete = (taskId: string) => {
    if (deleteConfirm === taskId) {
      onDeleteTask(taskId)
      setDeleteConfirm(null)
      playSound("click")
    } else {
      setDeleteConfirm(taskId)
    }
  }

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white w-[90vw] max-w-2xl rounded-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="w-6 h-6 text-green-400" />
            Complete History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {completedTasks.length > 0 ? (
            completedTasks.map((task) => {
              const { date, time } = formatDateTime(task.completedAt || 0)
              return (
                <Card key={task.id} className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{task.difficultyEmoji}</span>
                          <span className="text-lg">{task.priorityEmoji}</span>
                          <h3 className="font-semibold text-white">{task.name}</h3>
                          <Badge variant="secondary" className="ml-auto">
                            {task.xpValue} XP
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{task.description}</p>
                        <div className="flex gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {task.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{time}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={deleteConfirm === task.id ? "destructive" : "outline"}
                        onClick={() => handleDelete(task.id)}
                        className="ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleteConfirm === task.id ? "Confirm" : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No completed tasks yet. Start completing tasks to build your history!</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">Total completed tasks: {completedTasks.length}</p>
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
