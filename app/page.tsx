"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  SettingsIcon,
  Trophy,
  Calendar,
  LineChart,
} from "lucide-react";
import LoginButton from "../components/LoginButton";
import TodoPage from "./components/todo-page";
import JarsPage from "./components/jars-page";
import SettingsPage from "./components/settings-page";
import WeeklyDumpPage from "./components/weekly-dump-page";
import HistoryModal from "./components/history-modal";
import AddTaskModal from "./components/add-task-modal";
import { PlusCircle } from "lucide-react";
import type { AppSettings, Task, Jar } from "./types";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

import { useSupabaseData } from "../lib/use-supabase-data";
import React, { lazy, Suspense } from "react";
const AnalyticsPage = lazy(() => import("./analytics/page"));

export default function TaskJarApp() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "todo" | "jars" | "settings" | "dump" | "analytics"
  >("todo");
  const [currentJar, setCurrentJar] = useState<Jar | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  // Use Supabase data hook
  const {
    isLoading: dataLoading,
    error: dataError,
    settings,
    tasks,
    jars,
    weeklyTasks,
    archivedWeeks,
    updateSettings,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    addJar,
    updateJar,
    deleteJar,
    addTaskToJar,
    removeTaskFromJar,
    addWeeklyTask,
    updateWeeklyTask,
    deleteWeeklyTask,
    completeWeeklyTask,
    archiveWeek,
    updateDailyCompletion,
    getTodayCompletion,
  } = useSupabaseData();

  // Track completion for analytics - use Supabase data
  useEffect(() => {
    const updateCompletion = async () => {
      if (!user || dataLoading) return;

      const today = new Date().toISOString().split("T")[0];
      const todayTasks = tasks.filter((task) => {
        const taskDate = task.scheduledFor
          ? new Date(task.scheduledFor).toISOString().split("T")[0]
          : today;
        return taskDate === today;
      });

      if (todayTasks.length === 0) return;

      const completedTasks = todayTasks.filter((task) => task.completed);
      const completionPct = Math.round(
        (completedTasks.length / todayTasks.length) * 100
      );

      await updateDailyCompletion(completionPct);
    };

    updateCompletion();
  }, [tasks, user, dataLoading, updateDailyCompletion]);

  // Redirect authenticated users from landing to app
  useEffect(() => {
    if (!loading && user) {
      // User is authenticated, stay on main app
      return;
    }
  }, [user, loading]);

  // All useEffect hooks at the top
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Wait for both auth and data loading to complete
  const isAppLoading = loading || dataLoading || !isHydrated;

  // Data loading is now handled by useSupabaseData hook
  // Current jar management
  useEffect(() => {
    if (!user || dataLoading) return;

    const current = jars.find((jar) => !jar.completed);
    if (current) {
      // Ensure current jar has the correct target from settings
      if (current.targetXP !== settings.jarTarget) {
        updateJar(current.id, { targetXP: settings.jarTarget });
      }
      setCurrentJar(current);
    } else {
      // Create a new jar if none exist or all are completed
      const newJarData = {
        name: "My Jar",
        currentXP: 0,
        targetXP: settings.jarTarget,
        completed: false,
        tasks: [],
      };
      addJar(newJarData).then((newJar) => {
        if (newJar) {
          setCurrentJar(newJar);
        }
      }).catch((error) => {
        console.error('Failed to create jar:', error);
      });
    }
  }, [jars, settings.jarTarget, user, dataLoading, addJar, updateJar]);

  // Data persistence is now handled by Supabase - no need for localStorage sync

  useEffect(() => {
    if (
      currentJar &&
      !currentJar.completed &&
      currentJar.targetXP !== settings.jarTarget
    ) {
      const updatedJar = { ...currentJar, targetXP: settings.jarTarget };
      setCurrentJar(updatedJar);
      updateJar(currentJar.id, { targetXP: settings.jarTarget });
    }
  }, [settings.jarTarget, currentJar, updateJar]);

  // Conditional rendering after all hooks
  if (!isHydrated || isAppLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
          <div className="text-green-400 text-xl font-semibold">Loading TaskJar...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Show landing page for unauthenticated users
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold text-green-400 mb-6">
              TaskJar
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
              AI-Powered Task Management
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Transform your productivity with intelligent task organization, gamified progress tracking, and AI-powered planning.
            </p>
            <LoginButton />
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16">
          <h3 className="text-3xl font-bold text-center text-green-400 mb-12">
            Why TaskJar?
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/5 p-6 rounded-lg border border-green-500/30">
              <div className="text-4xl mb-4">🤖</div>
              <h4 className="text-xl font-semibold text-green-400 mb-3">AI Task Generation</h4>
              <p className="text-gray-400">
                Describe your goals in natural language and let AI break them down into actionable tasks with priorities and difficulty levels.
              </p>
            </div>
            <div className="bg-white/5 p-6 rounded-lg border border-green-500/30">
              <div className="text-4xl mb-4">🏆</div>
              <h4 className="text-xl font-semibold text-green-400 mb-3">Gamified Progress</h4>
              <p className="text-gray-400">
                Earn XP for completing tasks and fill up jars. Watch your productivity visualized in a fun, motivating way.
              </p>
            </div>
            <div className="bg-white/5 p-6 rounded-lg border border-green-500/30">
              <div className="text-4xl mb-4">📅</div>
              <h4 className="text-xl font-semibold text-green-400 mb-3">Weekly Planning</h4>
              <p className="text-gray-400">
                Dump your entire week's thoughts and let AI organize them into a structured daily schedule automatically.
              </p>
            </div>
            <div className="bg-white/5 p-6 rounded-lg border border-green-500/30">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-xl font-semibold text-green-400 mb-3">Analytics Dashboard</h4>
              <p className="text-gray-400">
                Track your completion rates, streaks, and productivity patterns with detailed analytics and insights.
              </p>
            </div>
            <div className="bg-white/5 p-6 rounded-lg border border-green-500/30">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="text-xl font-semibold text-green-400 mb-3">Smart Prioritization</h4>
              <p className="text-gray-400">
                Tasks are automatically categorized by priority (urgent, scheduled, optional) and difficulty (light, standard, challenging).
              </p>
            </div>
            <div className="bg-white/5 p-6 rounded-lg border border-green-500/30">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="text-xl font-semibold text-green-400 mb-3">Goal Tracking</h4>
              <p className="text-gray-400">
                Set XP targets, track your jars collection, and celebrate milestones as you complete your tasks.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="container mx-auto px-4 py-16">
          <h3 className="text-3xl font-bold text-center text-green-400 mb-12">
            How It Works
          </h3>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-xl font-bold">1</div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">Sign In with Google</h4>
                <p className="text-gray-400">Quick and secure authentication to get started in seconds.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-xl font-bold">2</div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">Add Tasks with AI</h4>
                <p className="text-gray-400">Type what you need to do in plain English, and AI generates structured tasks.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-xl font-bold">3</div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">Complete & Earn XP</h4>
                <p className="text-gray-400">Check off tasks to earn XP based on difficulty and fill up your jars.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-xl font-bold">4</div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">Track Your Progress</h4>
                <p className="text-gray-400">View analytics, maintain streaks, and watch your productivity soar.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center bg-gradient-to-r from-green-600/20 to-green-400/20 p-12 rounded-2xl border border-green-500/30">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Level Up Your Productivity?
            </h3>
            <p className="text-gray-300 mb-8">
              Join TaskJar today and experience the future of task management.
            </p>
            <LoginButton />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 py-8">
          <div className="container mx-auto px-4 text-center text-gray-400">
            <p>© 2025 TaskJar. AI-Powered Todo List by prats</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if data loading failed
  if (dataError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4 font-semibold">Failed to load data</div>
          <div className="text-gray-400 mb-6">{dataError}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Sound effects
  const playSound = (type: "click" | "complete" | "generate") => {
    if (!settings.preferences.soundEnabled) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case "click":
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          600,
          audioContext.currentTime + 0.1
        );
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.1
        );
        break;
      case "complete":
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(
          659,
          audioContext.currentTime + 0.1
        );
        oscillator.frequency.setValueAtTime(
          784,
          audioContext.currentTime + 0.2
        );
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3
        );
        break;
      case "generate":
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          880,
          audioContext.currentTime + 0.2
        );
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.2
        );
        break;
    }

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  // Complete task with jar logic
  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentJar) return;

    playSound("complete");

    // Complete the task
    await completeTask(taskId);

    // Add task to current jar
    await addTaskToJar(currentJar.id, taskId);

    // Update jar XP
    const newXP = currentJar.currentXP + task.xpValue;
    const jarUpdates: Partial<Jar> = {
      currentXP: newXP,
    };

    if (newXP >= currentJar.targetXP) {
      // Complete current jar
      jarUpdates.completed = true;
      jarUpdates.completedAt = Date.now();
      jarUpdates.currentXP = currentJar.targetXP;

      await updateJar(currentJar.id, jarUpdates);

      // Create new jar with overflow XP
      const overflowXP = newXP - currentJar.targetXP;
      const newJarData = {
        name: "My Jar",
        currentXP: overflowXP,
        targetXP: settings.jarTarget,
        completed: false,
        tasks: [],
      };

      const newJar = await addJar(newJarData);
      if (newJar) {
        setCurrentJar(newJar);
      }
    } else {
      // Just update current jar
      await updateJar(currentJar.id, jarUpdates);
      setCurrentJar({ ...currentJar, ...jarUpdates });
    }
  };

  const handleAddTask = async (
    task: Omit<Task, "id" | "completed" | "completedAt" | "createdAt">
  ) => {
    try {
      await addTask({
        ...task,
        completed: false,
        completedAt: undefined,
      });
      playSound("generate");
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const handleAddTasks = async (
    tasks: Omit<Task, "id" | "completed" | "completedAt" | "createdAt">[]
  ) => {
    try {
      for (const task of tasks) {
        await addTask({
          ...task,
          completed: false,
          completedAt: undefined,
        });
      }
      playSound("generate");
    } catch (error) {
      console.error("Failed to add tasks:", error);
    }
  };

  const handleNavigation = (
    section: "todo" | "jars" | "settings" | "dump" | "analytics"
  ) => {
    setActiveSection(section);
    playSound("click");
  };

  // Delete task from history
  const deleteTaskFromHistory = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      playSound("click");
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Clear all data - Note: This is a destructive operation in Supabase
  const clearAllData = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL your tasks and jars? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Delete all tasks and jars from Supabase
      // Note: This is a simplified version - in production you'd want more careful deletion
      for (const task of tasks) {
        await deleteTask(task.id);
      }
      for (const jar of jars) {
        await deleteJar(jar.id);
      }

      // Create a new jar
      const newJar = await addJar({
        name: "My Jar",
        currentXP: 0,
        targetXP: settings.jarTarget,
        completed: false,
        tasks: [],
      });
      if (newJar) {
        setCurrentJar(newJar);
      }

      playSound("click");
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          {activeSection === "todo" ? (
            // Remove this entire section - no header for todo page
            <></>
          ) : activeSection === "jars" ? (
            <>
              <h2 className="text-2xl font-bold text-white matrix-font-large">
                Jar Collection
              </h2>
              <p className="text-gray-400 text-sm italic mt-1">
                AI-Powered Todo List by prats
              </p>
            </>
          ) : activeSection === "settings" ? (
            <></>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white matrix-font-large">
                Weekly Dump
              </h2>
              <p className="text-gray-400 text-sm italic mt-1">
                AI-Powered Todo List by prats
              </p>
            </>
          )}
        </div>

        {/* Dynamic Island and History Button (Todo Page Only) */}
        {activeSection === "todo" && currentJar && (
          <div className="fixed top-6 left-6 z-40">
            <button
              onClick={() => setShowAddTask(true)}
              className="bg-black/90 backdrop-blur-xl border border-green-500/30 shadow-lg shadow-green-500/20 rounded-full p-3 hover:bg-green-600/20 transition-all duration-300"
            >
              <PlusCircle className="w-5 h-5 text-green-400" />
            </button>
          </div>
        )}

        {/* Main Content */}
        {activeSection === "todo" && (
          <TodoPage
            tasks={tasks}
            updateTask={updateTask}
            addTasks={handleAddTasks}
            settings={settings}
            completeTask={handleCompleteTask}
            deleteTask={deleteTask}
            playSound={playSound}
          />
        )}

        {activeSection === "jars" && (
          <JarsPage
            jars={jars}
            currentJar={currentJar}
            settings={settings}
            tasks={tasks}
          />
        )}

        {activeSection === "settings" && (
          <SettingsPage
            settings={settings}
            updateSettings={updateSettings}
            playSound={playSound}
            onClearAllData={clearAllData}
          />
        )}
        {activeSection === "analytics" && (
          <Suspense
            fallback={
              <div className="text-center p-8">Loading Analytics...</div>
            }
          >
            <AnalyticsPage />
          </Suspense>
        )}
        {activeSection === "dump" && (
          <WeeklyDumpPage
            settings={settings}
            weeklyTasks={weeklyTasks}
            addWeeklyTask={addWeeklyTask}
            updateWeeklyTask={updateWeeklyTask}
            deleteWeeklyTask={deleteWeeklyTask}
            completeWeeklyTask={completeWeeklyTask}
            archivedWeeks={archivedWeeks}
            archiveWeek={archiveWeek}
            handleAddTasks={handleAddTasks}
            playSound={playSound}
          />
        )}
      </div>

      {/* History Modal */}
      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        tasks={tasks}
        onDeleteTask={deleteTaskFromHistory}
        playSound={playSound}
      />

      <AddTaskModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        onAddTask={handleAddTask}
        settings={settings}
      />

      {/* Dynamic Island Navigation - Only Emojis */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-black/80 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNavigation("todo")}
              className={`p-3 rounded-full transition-all duration-300 ${
                activeSection === "todo"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleNavigation("jars")}
              className={`p-3 rounded-full transition-all duration-300 ${
                activeSection === "jars"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Trophy className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleNavigation("dump")}
              className={`p-3 rounded-full transition-all duration-300 ${
                activeSection === "dump"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Calendar className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleNavigation("analytics")}
              className={`p-3 rounded-full transition-all duration-300 ${
                activeSection === "analytics"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              aria-label="Analytics"
            >
              <LineChart className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleNavigation("settings")}
              className={`p-3 rounded-full transition-all duration-300 ${
                activeSection === "settings"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              aria-label="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
