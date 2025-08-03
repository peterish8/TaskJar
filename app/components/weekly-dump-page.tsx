"use client"

import type React from "react"

import { useState } from "react"
import { Calendar, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AppSettings, Task } from "../types"

interface WeeklyDumpPageProps {
  settings: AppSettings
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  playSound: (type: "click" | "complete" | "generate") => void
}

export default function WeeklyDumpPage({ settings, setTasks, playSound }: WeeklyDumpPageProps) {
  const [weeklyInput, setWeeklyInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedWeek, setParsedWeek] = useState<{ [key: string]: Partial<Task>[] }>({})

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
 
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
 
   const processWeeklyDump = async () => {
     if (!weeklyInput.trim()) return
 
     setIsProcessing(true)
     playSound("generate")
 
     try {
       const response = await fetch("/api/generate-weekly-tasks", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({ prompt: weeklyInput }),
       })
 
       if (!response.ok) {
         throw new Error("Failed to generate weekly tasks")
       }
 
       const tasksFromApi = await response.json()
 
       const newParsedWeek: { [key: string]: Partial<Task>[] } = {}
 
       tasksFromApi.forEach((task: any) => {
         const day = task.day
         if (!newParsedWeek[day]) {
           newParsedWeek[day] = []
         }
         const difficulty = mapDifficulty(task.difficulty)
         const priority = mapPriority(task.priority)
         newParsedWeek[day].push({
           name: task.name,
           description: task.description,
           priority: priority,
           difficulty: difficulty,
           priorityEmoji: settings.emojis.priority[priority],
           difficultyEmoji: settings.emojis.difficulty[difficulty],
           xpValue: settings.xpValues[difficulty],
         })
       })
 
       setParsedWeek(newParsedWeek)
       localStorage.setItem("parsedWeek", JSON.stringify(newParsedWeek))
     } catch (error) {
       console.error("Error processing weekly dump:", error)
     } finally {
       setIsProcessing(false)
     }
   }

  const scheduleWeeklyTasks = () => {
    playSound("click")

    const scheduledTasks: Task[] = []
    const today = new Date()
    const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.

    Object.entries(parsedWeek).forEach(([day, dayTasks]) => {
      const dayIndex = daysOfWeek.indexOf(day)
      const targetDate = new Date(today)

      // Calculate days until target day
      let daysUntil = dayIndex + 1 - currentDay // +1 because Monday = 1, Tuesday = 2, etc.
      if (daysUntil <= 0) daysUntil += 7 // Next week if day has passed

      targetDate.setDate(today.getDate() + daysUntil)

      dayTasks.forEach((task) => {
        const newTask: Task = {
          id: Date.now().toString() + Math.random(),
          name: task.name || "",
          description: task.description || "",
          priority: task.priority || "optional",
          difficulty: task.difficulty || "light",
          priorityEmoji: task.priorityEmoji || settings.emojis.priority.optional,
          difficultyEmoji: task.difficultyEmoji || settings.emojis.difficulty.light,
          xpValue: task.xpValue || settings.xpValues.light,
          completed: false,
          createdAt: Date.now(),
          scheduledFor: targetDate.toDateString(),
        }
        scheduledTasks.push(newTask)
      })
    })

    setTasks((prev) => [...prev, ...scheduledTasks])
    setParsedWeek({})
    setWeeklyInput("")
  }

  return (
    <div className="space-y-6">
      {/* Weekly Input */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 matrix-font">
            <Calendar className="w-5 h-5" />
            Weekly Planner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Describe your week in natural language..."
              value={weeklyInput}
              onChange={(e) => setWeeklyInput(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-32"
            />
            <Button
              onClick={processWeeklyDump}
              disabled={isProcessing || !weeklyInput.trim()}
              className="bg-green-600 hover:bg-green-700 w-full font-bold"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isProcessing ? "Processing Week..." : "Process Weekly Dump"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parsed Week Display */}
      {Object.keys(parsedWeek).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-green-300">Parsed Weekly Schedule</h3>

          <div className="grid gap-4">
            {daysOfWeek.map((day) => {
              const dayTasks = parsedWeek[day] || []
              if (dayTasks.length === 0) return null

              return (
                <Card key={day} className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-lg">{day}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dayTasks.map((task, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                          <span className="text-lg">{task.difficultyEmoji}</span>
                          <span className="text-lg">{task.priorityEmoji}</span>
                          <div className="flex-1">
                            <h4 className="font-medium">{task.name}</h4>
                            <p className="text-sm text-gray-300">{task.description}</p>
                          </div>
                          <Badge variant="secondary">{task.xpValue} XP</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                playSound("click")
                setParsedWeek({})
              }}
              className="border-white/20"
            >
              Cancel
            </Button>
            <Button onClick={scheduleWeeklyTasks} className="bg-green-600 hover:bg-green-700 font-bold">
              Schedule All Tasks
            </Button>
          </div>
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-green-900/20 border-green-500/30">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-2 text-green-300 matrix-font">How Weekly Dump Works:</h4>
          <ul className="text-sm text-green-200 space-y-1">
            <li>• Describe your entire week in natural language</li>
            <li>• AI will parse and organize tasks by day</li>
            <li>• Tasks will auto-appear on their scheduled days</li>
            <li>• Incomplete tasks carry over until completed</li>
            <li>• Perfect for bulk planning and weekly reviews</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
