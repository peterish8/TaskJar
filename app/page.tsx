"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, SettingsIcon, Trophy, Calendar } from "lucide-react"
import TodoPage from "./components/todo-page"
import JarsPage from "./components/jars-page"
import SettingsPage from "./components/settings-page"
import WeeklyDumpPage from "./components/weekly-dump-page"
import DynamicIsland from "./components/dynamic-island"
import HistoryModal from "./components/history-modal"
import AddTaskModal from "./components/add-task-modal"
import { PlusCircle } from "lucide-react"
import type { AppSettings, Task, Jar } from "./types"

// Default settings
const defaultSettings: AppSettings = {
  studentName: "Student",
  xpValues: {
    light: 5,
    standard: 10,
    challenging: 15,
  },
  jarTarget: 100,
  emojis: {
    priority: {
      urgent: "🔴",
      scheduled: "🟡",
      optional: "🟢",
    },
    difficulty: {
      light: "🍃",
      standard: "⚡",
      challenging: "🔥",
    },
  },
  parentLock: {
    enabled: false,
    password: "",
    securityQuestion: "",
    securityAnswer: "",
  },
  preferences: {
    soundEnabled: true,
    theme: "dark",
  },
}

export default function TaskJarApp() {
  const [activeSection, setActiveSection] = useState<"todo" | "jars" | "settings" | "dump">("todo")
  const [tasks, setTasks] = useState<Task[]>([])
  const [jars, setJars] = useState<Jar[]>([])
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [currentJar, setCurrentJar] = useState<Jar | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)

  // Sound effects
  const playSound = (type: "click" | "complete" | "generate") => {
    if (!settings.preferences.soundEnabled) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    switch (type) {
      case "click":
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        break
      case "complete":
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2)
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        break
      case "generate":
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.2)
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        break
    }

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  // Load data from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem("taskjar_tasks")
    const savedJars = localStorage.getItem("taskjar_jars")
    const savedSettings = localStorage.getItem("taskjar_settings")

    let loadedSettings = defaultSettings
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings)
      loadedSettings = {
        ...defaultSettings,
        ...parsedSettings,
        xpValues: {
          ...defaultSettings.xpValues,
          ...parsedSettings.xpValues,
        },
        emojis: {
          priority: {
            ...defaultSettings.emojis.priority,
            ...parsedSettings.emojis?.priority,
          },
          difficulty: {
            ...defaultSettings.emojis.difficulty,
            ...parsedSettings.emojis?.difficulty,
          },
        },
        parentLock: {
          ...defaultSettings.parentLock,
          ...parsedSettings.parentLock,
        },
        preferences: {
          ...defaultSettings.preferences,
          ...parsedSettings.preferences,
        },
      }
    }
    setSettings(loadedSettings)

    if (savedTasks) setTasks(JSON.parse(savedTasks))

    if (savedJars) {
      const parsedJars = JSON.parse(savedJars)
      setJars(parsedJars)
      const current = parsedJars.find((jar: Jar) => !jar.completed)
      if (current) {
        // Ensure current jar has the correct target from settings
        const updatedCurrent = { ...current, targetXP: loadedSettings.jarTarget }
        if (current.targetXP !== loadedSettings.jarTarget) {
          setJars(parsedJars.map((j: Jar) => (j.id === current.id ? updatedCurrent : j)))
        }
        setCurrentJar(updatedCurrent)
      } else {
        const newJar: Jar = {
          id: Date.now().toString(),
          currentXP: 0,
          targetXP: loadedSettings.jarTarget,
          completed: false,
          tasks: [],
        }
        setCurrentJar(newJar)
        setJars([newJar])
      }
    } else {
      const newJar: Jar = {
        id: Date.now().toString(),
        currentXP: 0,
        targetXP: loadedSettings.jarTarget,
        completed: false,
        tasks: [],
      }
      setCurrentJar(newJar)
      setJars([newJar])
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem("taskjar_tasks", JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem("taskjar_jars", JSON.stringify(jars))
  }, [jars])

  useEffect(() => {
    localStorage.setItem("taskjar_settings", JSON.stringify(settings))
  }, [settings])

  // Update current jar's targetXP when settings change
  useEffect(() => {
    if (currentJar && !currentJar.completed && currentJar.targetXP !== settings.jarTarget) {
      const updatedJar = { ...currentJar, targetXP: settings.jarTarget }
      setCurrentJar(updatedJar)
      setJars((prevJars) => prevJars.map((j) => (j.id === currentJar.id ? updatedJar : j)))
    }
  }, [settings.jarTarget, currentJar])

  // Complete task
  const completeTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task || !currentJar) return

    playSound("complete")

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: true, completedAt: Date.now() } : t)))

    const newXP = currentJar.currentXP + task.xpValue
    const updatedJar = {
      ...currentJar,
      currentXP: newXP,
      tasks: [...currentJar.tasks, taskId],
    }

    if (newXP >= currentJar.targetXP) {
      const completedJar = {
        ...updatedJar,
        completed: true,
        completedAt: Date.now(),
        currentXP: currentJar.targetXP,
      }

      const newJar: Jar = {
        id: Date.now().toString(),
        currentXP: newXP - currentJar.targetXP,
        targetXP: settings.jarTarget,
        completed: false,
        tasks: [],
      }

      setJars((prev) => prev.map((j) => (j.id === currentJar.id ? completedJar : j)).concat(newJar))
      setCurrentJar(newJar)
    } else {
      setJars((prev) => prev.map((j) => (j.id === currentJar.id ? updatedJar : j)))
      setCurrentJar(updatedJar)
    }
  }

  const handleAddTask = (task: Omit<Task, "id" | "completed" | "completedAt">) => {
    const newTask = {
      ...task,
      id: Date.now().toString(),
      completed: false,
      completedAt: undefined,
    }
    setTasks((prev) => [newTask, ...prev])
    playSound("generate")
  }

  const handleNavigation = (section: "todo" | "jars" | "settings" | "dump") => {
    playSound("click")
    setActiveSection(section)
  }

  // Delete task from history
  const deleteTaskFromHistory = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    playSound("click")
  }

  // Clear all data
  const clearAllData = () => {
    setTasks([])
    setJars([])
    const newJar: Jar = {
      id: Date.now().toString(),
      currentXP: 0,
      targetXP: settings.jarTarget,
      completed: false,
      tasks: [],
    }
    setCurrentJar(newJar)
    setJars([newJar])
    localStorage.removeItem("taskjar_tasks")
    localStorage.removeItem("taskjar_jars")
    playSound("click")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          {activeSection === "todo" ? (
            // Remove this entire section - no header for todo page
            <></>
          ) : activeSection === "jars" ? (
            <>
              <h2 className="text-2xl font-bold text-white matrix-font-large">Jar Collection</h2>
              <p className="text-gray-400 text-sm italic mt-1">AI-Powered Todo List by prats</p>
            </>
          ) : activeSection === "settings" ? (
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent matrix-font-large">
              TaskJar
            </h1>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white matrix-font-large">Weekly Dump</h2>
              <p className="text-gray-400 text-sm italic mt-1">AI-Powered Todo List by prats</p>
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
          <DynamicIsland jar={currentJar} tasks={tasks} jars={jars} onHistoryClick={() => setShowHistory(true)} />
        )}

        {/* Main Content */}
        {activeSection === "todo" && (
          <TodoPage
            tasks={tasks}
            setTasks={setTasks}
            settings={settings}
            completeTask={completeTask}
            playSound={playSound}
          />
        )}

        {activeSection === "jars" && <JarsPage jars={jars} currentJar={currentJar} settings={settings} tasks={tasks} />}

        {activeSection === "settings" && (
          <SettingsPage
            settings={settings}
            setSettings={setSettings}
            playSound={playSound}
            onClearAllData={clearAllData}
          />
        )}

        {activeSection === "dump" && <WeeklyDumpPage settings={settings} setTasks={setTasks} playSound={playSound} />}
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
                activeSection === "todo" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleNavigation("jars")}
              className={`p-3 rounded-full transition-all duration-300 ${
                activeSection === "jars" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Trophy className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleNavigation("dump")}
              className={`p-3 rounded-full transition-all duration-300 ${
                activeSection === "dump" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Calendar className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleNavigation("settings")}
              className={`p-3 rounded-full transition-all duration-300 ${
                activeSection === "settings" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
