"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Zap,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppSettings, Task, WeeklyTask, ArchivedWeek } from "../types";
import {
  getTodayISO,
  getWeekWindow,
  formatDateForDisplay,
  formatWeekRange,
  toISODate,
  fromISODate,
  isToday,
  isPastDate,
  debugWeekWindow,
} from "@/lib/date";
import { load, save, STORAGE_KEYS } from "@/lib/storage";
import WeeklyHistoryDrawer from "./weekly-history-drawer";

interface WeeklyDumpPageProps {
  settings: AppSettings;
  weeklyTasks: WeeklyTask[];
  addWeeklyTask: (task: Omit<WeeklyTask, "id" | "createdAt">) => Promise<WeeklyTask>;
  updateWeeklyTask: (taskId: string, updates: Partial<WeeklyTask>) => Promise<WeeklyTask>;
  deleteWeeklyTask: (taskId: string) => Promise<void>;
  completeWeeklyTask: (taskId: string) => Promise<WeeklyTask>;
  archivedWeeks: ArchivedWeek[];
  archiveWeek: (weekData: ArchivedWeek) => Promise<void>;
  handleAddTasks: (tasks: Omit<Task, "id" | "completed" | "completedAt" | "createdAt">[]) => Promise<void>;
  playSound: (type: "click" | "complete" | "generate") => void;
}

export default function WeeklyDumpPage({
  settings,
  weeklyTasks,
  addWeeklyTask,
  updateWeeklyTask,
  deleteWeeklyTask,
  completeWeeklyTask,
  archivedWeeks,
  archiveWeek,
  handleAddTasks,
  playSound,
}: WeeklyDumpPageProps) {
  const [weeklyInput, setWeeklyInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(getTodayISO());
  // weeklyTasks now comes from props
  const [showHistory, setShowHistory] = useState(false);
  const dateStripRef = useRef<HTMLDivElement>(null);

  // Data is now managed by Supabase - no localStorage needed

  // Generate date strip (14-21 days around today)
  const generateDateStrip = () => {
    const today = new Date();
    const dates = [];

    // 7 days before today
    for (let i = -7; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(toISODate(date));
    }

    return dates;
  };

  const dateStrip = generateDateStrip();
  const weekWindow = getWeekWindow(selectedStartDate);

  // Debug the week window when it changes
  useEffect(() => {
    console.log("Selected Start Date:", selectedStartDate);
    debugWeekWindow(selectedStartDate);
  }, [selectedStartDate]);

  const mapPriority = (
    priority: "low" | "medium" | "high"
  ): "optional" | "scheduled" | "urgent" => {
    switch (priority) {
      case "low":
        return "optional";
      case "medium":
        return "scheduled";
      case "high":
        return "urgent";
    }
  };

  const mapDifficulty = (
    difficulty: "easy" | "moderate" | "hard"
  ): "light" | "standard" | "challenging" => {
    switch (difficulty) {
      case "easy":
        return "light";
      case "moderate":
        return "standard";
      case "hard":
        return "challenging";
    }
  };

  const processWeeklyDump = async () => {
    if (!weeklyInput.trim()) return;

    setIsProcessing(true);
    playSound("generate");

    try {
      const response = await fetch("/api/generate-weekly-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: weeklyInput,
          weekWindow: weekWindow, // Send the selected week window
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate weekly tasks");
      }

      const tasksFromApi = await response.json();

      // Debug API response
      console.log("API Response:", tasksFromApi);
      console.log("Week Window:", weekWindow);

      // Convert API tasks to WeeklyTask format and constrain to week window
      const newWeeklyTasks: WeeklyTask[] = tasksFromApi.map(
        (task: any, index: number) => {
          // If task has a date, validate it's in the week window, otherwise distribute evenly
          let scheduledDate: string;
          if (task.scheduledDate && weekWindow.includes(task.scheduledDate)) {
            scheduledDate = task.scheduledDate;
          } else {
            // Distribute evenly across the week - improved logic
            const dayIndex = Math.floor((index * 7) / tasksFromApi.length);
            scheduledDate = weekWindow[Math.min(dayIndex, 6)]; // Ensure we don't go beyond 7 days
          }

          // Debug task distribution
          console.log(
            `Task ${index}: "${
              task.name
            }" -> ${scheduledDate} (day ${Math.floor(
              (index * 7) / tasksFromApi.length
            )})`
          );

          return {
            id: `weekly-${Date.now()}-${index}`,
            name: task.name,
            description: task.description,
            priority: task.priority || "medium",
            difficulty: task.difficulty || "moderate",
            scheduledDate,
            completed: false,
            createdAt: Date.now(),
          };
        }
      );

      setWeeklyTasks(newWeeklyTasks);
    } catch (error) {
      console.error("Error processing weekly dump:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const scheduleAllTasks = async () => {
    if (weeklyTasks.length === 0) {
      return;
    }

    playSound("click");

    // Create archived week snapshot
    const archivedWeek: ArchivedWeek = {
      id: `week-${Date.now()}`,
      startDateISO: selectedStartDate,
      dates: weekWindow,
      tasks: [...weeklyTasks], // Snapshot of current tasks
      createdAtISO: new Date().toISOString(),
    };

    // Add to archived weeks
    await archiveWeek(archivedWeek);

    // Convert weekly tasks to daily tasks and add to main task list
    const dailyTasks: Task[] = weeklyTasks.map((task) => ({
      id: task.id,
      name: task.name,
      description: task.description || "",
      priority: mapPriority(task.priority),
      difficulty: mapDifficulty(task.difficulty),
      priorityEmoji:
        task.priority === "high"
          ? "🔴"
          : task.priority === "medium"
          ? "🟡"
          : "🟢",
      difficultyEmoji:
        task.difficulty === "hard"
          ? "🔥"
          : task.difficulty === "moderate"
          ? "⚡"
          : "🍃",
      xpValue: settings.xpValues[mapDifficulty(task.difficulty)],
      completed: false,
      createdAt: task.createdAt,
      scheduledFor: task.scheduledDate,
    }));

    // Add daily tasks to main tasks list
    await handleAddTasks(dailyTasks);

    // Clear weekly tasks - delete all weekly tasks from Supabase
    for (const task of weeklyTasks) {
      await deleteWeeklyTask(task.id);
    }
    setWeeklyInput("");
  };

  const updateTask = async (taskId: string, updates: Partial<WeeklyTask>) => {
    try {
      await updateWeeklyTask(taskId, updates);
      playSound("click");
    } catch (error) {
      console.error('Failed to update weekly task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteWeeklyTask(taskId);
      playSound("click");
    } catch (error) {
      console.error('Failed to delete weekly task:', error);
    }
  };

  const scrollDateStrip = (direction: "left" | "right") => {
    if (dateStripRef.current) {
      const scrollAmount = 200;
      const newScrollLeft =
        dateStripRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);
      dateStripRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "hard":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "moderate":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "easy":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const getDifficultyEmoji = (difficulty: string) => {
    switch (difficulty) {
      case "hard":
        return "🔥";
      case "moderate":
        return "⚡";
      case "easy":
        return "🍃";
      default:
        return "⚪";
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Strip */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Week of {formatWeekRange(selectedStartDate)}
            </span>
            <Button
              onClick={() => setShowHistory(true)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <History className="w-5 h-5" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Button
              onClick={() => scrollDateStrip("left")}
              variant="ghost"
              size="sm"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div
              ref={dateStripRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide px-8 py-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {dateStrip.map((date) => {
                const isSelected = date === selectedStartDate;
                const isTodayDate = isToday(date);
                const isInWeekWindow = weekWindow.includes(date);

                return (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedStartDate(date);
                      playSound("click");
                    }}
                    className={`flex flex-col items-center p-3 rounded-lg min-w-[60px] transition-all duration-200 ${
                      isSelected
                        ? "bg-green-600 text-white shadow-lg"
                        : isTodayDate
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : isInWeekWindow
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xs font-medium">
                      {fromISODate(date).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </span>
                    <span className="text-lg font-bold">
                      {fromISODate(date).getDate().toString().padStart(2, "0")}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => scrollDateStrip("right")}
              variant="ghost"
              size="sm"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Input */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 matrix-font">
            <Zap className="w-5 h-5" />
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

      {/* Weekly Tasks Display */}
      {weeklyTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-green-300">
              Weekly Schedule
            </h3>
            <Button
              onClick={scheduleAllTasks}
              className="bg-green-600 hover:bg-green-700 font-bold"
            >
              Schedule All Tasks
            </Button>
          </div>

          <div className="grid gap-4">
            {weekWindow.map((date) => {
              const dayTasks = weeklyTasks.filter(
                (task) => task.scheduledDate === date
              );
              const isTodayDate = isToday(date);
              const isPast = isPastDate(date);

              return (
                <Card
                  key={date}
                  className={`bg-white/10 backdrop-blur-md border-white/20 ${
                    isTodayDate ? "border-green-500/50 bg-green-500/10" : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span
                        className={`text-lg ${
                          isTodayDate ? "text-green-300" : "text-white"
                        }`}
                      >
                        {formatDateForDisplay(date)}
                      </span>
                      <div className="flex gap-2">
                        {isTodayDate && (
                          <Badge className="bg-green-600 text-white">
                            Today
                          </Badge>
                        )}
                        {isPast && !isTodayDate && (
                          <Badge className="bg-gray-600 text-gray-300">
                            Past
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {dayTasks.length} tasks
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dayTasks.length > 0 ? (
                      <div className="space-y-3">
                        {dayTasks.map((task) => (
                          <div
                            key={task.id}
                            className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10"
                          >
                            {/* Task Name */}
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {getDifficultyEmoji(task.difficulty)}
                              </span>
                              <span className="text-lg">
                                {getPriorityEmoji(task.priority)}
                              </span>
                              <Input
                                value={task.name}
                                onChange={(e) =>
                                  updateTask(task.id, { name: e.target.value })
                                }
                                className="flex-1 bg-white/10 border-white/20 text-white"
                                placeholder="Task name"
                              />
                              <Button
                                onClick={() => deleteTask(task.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300"
                              >
                                ×
                              </Button>
                            </div>

                            {/* Task Description */}
                            <Textarea
                              value={task.description || ""}
                              onChange={(e) =>
                                updateTask(task.id, {
                                  description: e.target.value,
                                })
                              }
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-16"
                              placeholder="Task description (optional)"
                            />

                            {/* Priority and Difficulty */}
                            <div className="flex gap-2">
                              <Select
                                value={task.priority}
                                onValueChange={(value) =>
                                  updateTask(task.id, {
                                    priority: value as
                                      | "low"
                                      | "medium"
                                      | "high",
                                  })
                                }
                              >
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">
                                    Low Priority
                                  </SelectItem>
                                  <SelectItem value="medium">
                                    Medium Priority
                                  </SelectItem>
                                  <SelectItem value="high">
                                    High Priority
                                  </SelectItem>
                                </SelectContent>
                              </Select>

                              <Select
                                value={task.difficulty}
                                onValueChange={(value) =>
                                  updateTask(task.id, {
                                    difficulty: value as
                                      | "easy"
                                      | "moderate"
                                      | "hard",
                                  })
                                }
                              >
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="easy">Easy</SelectItem>
                                  <SelectItem value="moderate">
                                    Moderate
                                  </SelectItem>
                                  <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Badges */}
                            <div className="flex gap-2">
                              <Badge
                                className={getPriorityColor(task.priority)}
                              >
                                {task.priority}
                              </Badge>
                              <Badge
                                className={getDifficultyColor(task.difficulty)}
                              >
                                {task.difficulty}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">
                        No tasks scheduled
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-green-900/20 border-green-500/30">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-2 text-green-300 matrix-font">
            How Weekly Dump Works:
          </h4>
          <ul className="text-sm text-green-200 space-y-1">
            <li>• Select any date to set your week start (default: today)</li>
            <li>• Describe your entire week in natural language</li>
            <li>
              • AI will parse and organize tasks by day within your selected
              week
            </li>
            <li>• Edit tasks inline before scheduling</li>
            <li>• Schedule all tasks to move them to your daily todo list</li>
            <li>• View archived weeks in the history</li>
          </ul>
        </CardContent>
      </Card>

      {/* History Drawer */}
      <WeeklyHistoryDrawer
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        archivedWeeks={archivedWeeks}
        playSound={playSound}
      />
    </div>
  );
}
