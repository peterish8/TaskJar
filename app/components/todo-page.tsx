"use client"

import type React from "react"

import { useState } from "react"
import { CheckCircle2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Task, AppSettings } from "../types"

interface TodoPageProps {
  tasks: Task[]
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task>
  addTasks: (tasks: Omit<Task, "id" | "completed" | "completedAt" | "createdAt">[]) => Promise<void>
  settings: AppSettings
  completeTask: (taskId: string) => void
  deleteTask: (taskId: string) => Promise<void>
  playSound: (type: "click" | "complete" | "generate") => void
}

export default function TodoPage({ tasks, updateTask, addTasks, settings, completeTask, deleteTask, playSound }: TodoPageProps) {
  const [aiInput, setAiInput] = useState("")
  const [generatedTasks, setGeneratedTasks] = useState<Partial<Task>[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showTaskEditor, setShowTaskEditor] = useState(false)
 
   const mapPriority = (priority: "low" | "medium" | "high"): "optional" | "scheduled" | "urgent" => {
     switch (priority) {
       case "low":
         return "optional"
       case "medium":
         return "scheduled"
       case "high":
         return "urgent"
     }
   }
 
   const mapDifficulty = (difficulty: "easy" | "moderate" | "hard"): "light" | "standard" | "challenging" => {
     switch (difficulty) {
       case "easy":
         return "light"
       case "moderate":
         return "standard"
       case "hard":
         return "challenging"
     }
   }
 
   // AI Task Generation
   const generateTasks = async () => {
     if (!aiInput.trim()) return
 
     setIsGenerating(true)
     playSound("generate")
 
     try {
       const response = await fetch("/api/generate-tasks", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({ prompt: aiInput }),
       })
 
       if (!response.ok) {
         throw new Error("Failed to generate tasks")
       }
 
       const tasksFromApi = await response.json()
 
       const newTasks: Partial<Task>[] = tasksFromApi.map((task: any) => {
         const difficulty = mapDifficulty(task.difficulty)
         const priority = mapPriority(task.priority)
         return {
           name: task.name,
           description: task.description,
           priority: priority,
           difficulty: difficulty,
           priorityEmoji: settings.emojis.priority[priority],
           difficultyEmoji: settings.emojis.difficulty[difficulty],
           xpValue: settings.xpValues[difficulty],
         }
       })
 
       setGeneratedTasks(newTasks)
       setShowTaskEditor(true)
     } catch (error) {
       console.error("Error generating tasks:", error)
     } finally {
       setIsGenerating(false)
     }
   }

  const addTasksToList = async (tasksToAdd: Partial<Task>[]) => {
    playSound("click")

    const newTasks: Omit<Task, "id" | "completed" | "completedAt" | "createdAt">[] = tasksToAdd.map((task) => ({
      name: task.name || "",
      description: task.description || "",
      priority: task.priority || "optional",
      difficulty: task.difficulty || "light",
      priorityEmoji: task.priorityEmoji || settings.emojis.priority.optional,
      difficultyEmoji: task.difficultyEmoji || settings.emojis.difficulty.light,
      xpValue: task.xpValue || settings.xpValues.light,
    }))

    await addTasks(newTasks)
    setGeneratedTasks([])
    setShowTaskEditor(false)
    setAiInput("")
  }

  // Get today's tasks
  const todaysTasks = tasks.filter((task) => {
    const today = new Date().toDateString()
    const taskDate = new Date(task.createdAt).toDateString()
    return taskDate === today && !task.scheduledFor
  })

  const pendingTasks = todaysTasks.filter((task) => !task.completed)
  const completedTasks = todaysTasks.filter((task) => task.completed)

  // Sort tasks by priority then difficulty
  const sortTasks = (tasks: Task[]) => {
    const priorityOrder = { urgent: 0, scheduled: 1, optional: 2 }
    const difficultyOrder = { challenging: 0, standard: 1, light: 2 }

    return tasks.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
    })
  }

  const sortedPendingTasks = sortTasks(pendingTasks)

  const TaskCard = ({ task, showCompleteButton = true }: { task: Task; showCompleteButton?: boolean }) => (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
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
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {task.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {task.priority}
              </Badge>
            </div>
          </div>
          {showCompleteButton && !task.completed && (
            <Button size="sm" onClick={() => completeTask(task.id)} className="ml-4 bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 mt-20">
      {/* AI Task Generation */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 matrix-font">
            <Zap className="w-5 h-5" />
            AI Task Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <Textarea
              placeholder="Describe today's list of works you wanna achieve in natural language..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none h-24 overflow-y-auto"
            />
            <div className="flex justify-center">
              <Button
                onClick={generateTasks}
                disabled={isGenerating || !aiInput.trim()}
                className="bg-green-600 hover:bg-green-700 px-8 font-bold"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      <div>
        <h2 className="text-2xl font-bold mb-4 matrix-font">Today's Tasks</h2>

        {/* Pending Tasks */}
        {sortedPendingTasks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-green-300 matrix-font">Pending Tasks</h3>
            <div className="space-y-3">
              {sortedPendingTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-300 matrix-font">Completed Today</h3>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} showCompleteButton={false} />
              ))}
            </div>
          </div>
        )}

        {todaysTasks.length === 0 && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-8 text-center">
              <p className="text-gray-300">No tasks for today. Use the AI generator to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Task Editor Dialog */}
      <Dialog open={showTaskEditor} onOpenChange={setShowTaskEditor}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Generated Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {generatedTasks.map((task, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{task.difficultyEmoji}</span>
                    <span className="text-lg">{task.priorityEmoji}</span>
                    <Input
                      value={task.name || ""}
                      onChange={(e) => {
                        const updated = [...generatedTasks]
                        updated[index] = { ...updated[index], name: e.target.value }
                        setGeneratedTasks(updated)
                      }}
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <Badge variant="secondary">{task.xpValue} XP</Badge>
                  </div>
                  <Textarea
                    value={task.description || ""}
                    onChange={(e) => {
                      const updated = [...generatedTasks]
                      updated[index] = { ...updated[index], description: e.target.value }
                      setGeneratedTasks(updated)
                    }}
                    className="bg-white/10 border-white/20 text-white mb-2"
                  />
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {task.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.priority}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowTaskEditor(false)} className="border-white/20">
              Cancel
            </Button>
            <Button onClick={() => addTasksToList(generatedTasks)} className="bg-green-600 hover:bg-green-700">
              Add All Tasks
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
