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
import DynamicIsland from "./components/dynamic-island";
import HistoryModal from "./components/history-modal";
import AddTaskModal from "./components/add-task-modal";
import { PlusCircle } from "lucide-react";
import type { AppSettings, Task, Jar } from "./types";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useCompletionUpdater } from "./hooks/useCompletionUpdater";
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
      const completionPct = Math.round((completedTasks.length / todayTasks.length) * 100);

      await updateDailyCompletion(completionPct);
    };

    updateCompletion();
  }, [tasks, user, dataLoading, updateDailyCompletion]);

  // Immediate redirect to landing if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/landing");
    }
  }, [user, loading, router]);

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
        setCurrentJar(newJar);
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
      setJars((prevJars) =>
        prevJars.map((j) => (j.id === currentJar.id ? updatedJar : j))
      );
    }
  }, [settings.jarTarget, currentJar]);

  // Conditional rendering after all hooks
  if (!isHydrated || isAppLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading TaskJar...</div>
      </div>
    );
  }

  if (!user) {
    router.replace("/landing");
    return null;
  }

  // Show error state if data loading failed
  if (dataError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-red-400 text-xl mb-4">Failed to load data</div>
          <div className="text-gray-400">{dataError}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
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
      setCurrentJar(newJar);
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
      console.error('Failed to add task:', error);
    }
  };

  const handleAddTasks = async (tasks: Omit<Task, "id" | "completed" | "completedAt" | "createdAt">[]) => {
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
      console.error('Failed to add tasks:', error);
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
      console.error('Failed to delete task:', error);
    }
  };

  // Clear all data - Note: This is a destructive operation in Supabase
  const clearAllData = async () => {
    if (!confirm('Are you sure you want to delete ALL your tasks and jars? This action cannot be undone.')) {
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
      setCurrentJar(newJar);

      playSound("click");
    } catch (error) {
      console.error('Failed to clear data:', error);
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
        {activeSection === "todo" && currentJar && (
          <DynamicIsland
            jar={currentJar}
            tasks={tasks}
            jars={jars}
            onHistoryClick={() => setShowHistory(true)}
          />
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
