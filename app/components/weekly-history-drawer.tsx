"use client"

import { useState } from "react"
import { X, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ArchivedWeek, WeeklyTask } from "../types"
import { formatWeekRange, formatDateForDisplay, isToday, isPastDate } from "@/lib/date"

interface WeeklyHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  archivedWeeks: ArchivedWeek[]
  playSound: (type: "click" | "complete" | "generate") => void
}

export default function WeeklyHistoryDrawer({ 
  isOpen, 
  onClose, 
  archivedWeeks, 
  playSound 
}: WeeklyHistoryDrawerProps) {
  const [selectedWeek, setSelectedWeek] = useState<ArchivedWeek | null>(null)

  if (!isOpen) return null

  const handleWeekSelect = (week: ArchivedWeek) => {
    playSound("click")
    setSelectedWeek(week)
  }

  const handleBack = () => {
    playSound("click")
    setSelectedWeek(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-300 border-red-500/30"
      case "medium": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "low": return "bg-green-500/20 text-green-300 border-green-500/30"
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "hard": return "bg-red-500/20 text-red-300 border-red-500/30"
      case "moderate": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "easy": return "bg-green-500/20 text-green-300 border-green-500/30"
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case "high": return "🔴"
      case "medium": return "🟡"
      case "low": return "🟢"
      default: return "⚪"
    }
  }

  const getDifficultyEmoji = (difficulty: string) => {
    switch (difficulty) {
      case "hard": return "🔥"
      case "moderate": return "⚡"
      case "easy": return "🍃"
      default: return "⚪"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">
              {selectedWeek ? "Weekly Plan Details" : "Weekly History"}
            </h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {selectedWeek ? (
            // Week Details View
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-green-300">
                  {formatWeekRange(selectedWeek.startDateISO)}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(selectedWeek.createdAtISO).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                {selectedWeek.dates.map((date) => {
                  const dayTasks = selectedWeek.tasks.filter(task => task.scheduledDate === date)
                  const isTodayDate = isToday(date)
                  const isPast = isPastDate(date)
                  
                  return (
                    <Card key={date} className={`bg-white/10 backdrop-blur-md border-white/20 ${
                      isTodayDate ? 'border-green-500/50 bg-green-500/10' : ''
                    }`}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className={`text-lg ${isTodayDate ? 'text-green-300' : 'text-white'}`}>
                            {formatDateForDisplay(date)}
                          </span>
                          {isTodayDate && (
                            <Badge className="bg-green-600 text-white">Today</Badge>
                          )}
                          {isPast && !isTodayDate && (
                            <Badge className="bg-gray-600 text-gray-300">Past</Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {dayTasks.length > 0 ? (
                          <div className="space-y-3">
                            {dayTasks.map((task) => (
                              <div 
                                key={task.id} 
                                className={`flex items-center gap-3 p-3 rounded-lg ${
                                  task.completed 
                                    ? 'bg-green-500/10 border border-green-500/30' 
                                    : 'bg-white/5 border border-white/10'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getDifficultyEmoji(task.difficulty)}</span>
                                  <span className="text-lg">{getPriorityEmoji(task.priority)}</span>
                                </div>
                                <div className="flex-1">
                                  <h4 className={`font-medium ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                                    {task.name}
                                  </h4>
                                  {task.description && (
                                    <p className={`text-sm ${task.completed ? 'text-gray-500' : 'text-gray-300'}`}>
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                  </Badge>
                                  <Badge className={getDifficultyColor(task.difficulty)}>
                                    {task.difficulty}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-center py-4">No tasks scheduled</p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleBack} variant="outline" className="border-white/20">
                  Back to History
                </Button>
              </div>
            </div>
          ) : (
            // History List View
            <div className="space-y-4">
              {archivedWeeks.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No Archived Weeks</h3>
                  <p className="text-gray-500">
                    Your scheduled weekly plans will appear here
                  </p>
                </div>
              ) : (
                archivedWeeks.map((week) => (
                  <Card 
                    key={week.id} 
                    className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 cursor-pointer transition-colors"
                    onClick={() => handleWeekSelect(week)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">
                            {formatWeekRange(week.startDateISO)}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {week.tasks.length} tasks • Created {new Date(week.createdAtISO).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-600 text-white">
                            {week.tasks.filter(t => t.completed).length} completed
                          </Badge>
                          <Calendar className="w-5 h-5 text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 