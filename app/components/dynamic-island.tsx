"use client"

import { useState, useEffect, useRef } from "react"
import { History } from "lucide-react"
import type { Jar, Task } from "../types"

interface DynamicIslandProps {
  jar: Jar
  tasks: Task[]
  jars: Jar[]
  onHistoryClick: () => void
}

export default function DynamicIsland({ jar, tasks, jars, onHistoryClick }: DynamicIslandProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const targetXP = jar.targetXP || 100
  const fillPercentage = (jar.currentXP / targetXP) * 100
  const islandRef = useRef<HTMLDivElement>(null)

  // Get completed tasks for current jar
  const completedTasksForJar = tasks.filter((task) => jar.tasks.includes(task.id) && task.completed)
  const totalCompletedTasks = tasks.filter((task) => task.completed).length
  const totalJarsCompleted = jars.filter((j) => j.completed).length

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (islandRef.current && !islandRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isExpanded])

  return (
    <>
      {/* History Button */}
      <div className="fixed top-6 right-6 z-40">
        <button
          onClick={onHistoryClick}
          className="bg-black/90 backdrop-blur-xl border border-green-500/30 shadow-lg shadow-green-500/20 rounded-full p-3 hover:bg-green-600/20 transition-all duration-300"
        >
          <History className="w-5 h-5 text-green-400" />
        </button>
      </div>

      {/* Full screen overlay when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-30 transition-all duration-700 ease-out"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40">
        <div
          ref={islandRef}
          className={`bg-black/90 backdrop-blur-xl border border-green-500/30 overflow-hidden cursor-pointer rounded-full transition-all duration-700 ease-out transform ${
            isExpanded
              ? "w-[85vw] max-w-sm h-[75vh] max-h-[500px] scale-100"
              : "px-6 py-3 w-auto h-auto scale-100 hover:scale-105"
          }`}
          style={
            isExpanded
              ? {
                  boxShadow: "0 10px 25px rgba(29, 185, 84, 0.2), 0 0 10px rgba(29, 185, 84, 0.1)",
                  transform: "scale(1)",
                }
              : {
                  boxShadow: "0 4px 10px rgba(29, 185, 84, 0.25)",
                }
          }
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Collapsed State */}
          <div
            className={`flex items-center gap-4 transition-all duration-700 ease-out ${
              isExpanded ? "opacity-0 scale-75" : "opacity-100 scale-100"
            }`}
            style={{
              display: isExpanded ? "none" : "flex",
              transitionDelay: isExpanded ? "0ms" : "300ms",
            }}
          >
            <div className="text-sm matrix-font">
              <span className="text-green-400">{jar.currentXP}</span>
              <span className="text-gray-400">/{targetXP}</span>
            </div>
            <div className="w-20 bg-gray-700 rounded-full h-2 flex items-center">
              <div
                className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>

          {/* Expanded State */}
          <div
            className={`flex flex-col items-center justify-center gap-4 h-full w-full px-6 py-8 transition-all duration-700 ease-out ${
              isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-125"
            }`}
            style={{
              display: isExpanded ? "flex" : "none",
              transitionDelay: isExpanded ? "300ms" : "0ms",
            }}
          >
            <h3 className="text-lg font-bold text-green-400 animate-fade-in">Current Progress</h3>

            {/* Custom Jar - Fixed alignment */}
            <div className="relative w-24 h-32 mx-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
              <div className="absolute inset-0 border-3 border-white/30 rounded-b-full bg-transparent">
                <div className="-top-3 left-1/2 transform -translate-x-1/2 w-10 h-4 border-3 border-white/30 border-b-0 rounded-t-lg bg-black absolute"></div>

                {/* Liquid Container - Clipped to jar shape */}
                <div className="absolute inset-0 rounded-b-full overflow-hidden">
                  {/* Liquid Fill */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-400 to-green-300 rounded-b-full transition-all duration-1000 ease-out"
                    style={{ height: `${fillPercentage}%` }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-green-200 opacity-60 animate-pulse"></div>
                  </div>
                </div>

                <div className="absolute top-2 left-2 w-3 h-6 bg-white/20 rounded-full blur-sm"></div>
              </div>
            </div>

            <div className="text-center space-y-1 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="text-base">
                <span className="text-green-400 font-bold text-xl">{jar.currentXP}</span>
                <span className="text-gray-400 text-lg">/{targetXP} XP</span>
              </div>
              <p className="text-xs text-gray-400">{Math.round(fillPercentage)}% Complete</p>
            </div>

            <div
              className="w-4/5 bg-gray-700 rounded-full h-2 animate-fade-in flex items-center mx-auto"
              style={{ animationDelay: "300ms" }}
            >
              <div
                className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${fillPercentage}%` }}
              />
            </div>

            {/* 3 Circular Statistics */}
            <div
              className="flex justify-center items-center gap-3 w-full animate-fade-in"
              style={{ animationDelay: "400ms" }}
            >
              {/* Current Jar Tasks */}
              <div className="bg-white/10 rounded-full w-16 h-16 flex flex-col items-center justify-center transform hover:scale-110 transition-transform duration-300">
                <p className="text-lg font-bold text-green-400">{completedTasksForJar.length}</p>
                <p className="text-[8px] text-gray-400 text-center leading-tight">
                  Current
                  <br />
                  Jar
                </p>
              </div>

              {/* Total Tasks */}
              <div className="bg-white/10 rounded-full w-20 h-20 flex flex-col items-center justify-center transform hover:scale-110 transition-transform duration-300">
                <p className="text-2xl font-bold text-blue-400">{totalCompletedTasks}</p>
                <p className="text-[9px] text-gray-400 text-center leading-tight">
                  Total
                  <br />
                  Tasks
                </p>
              </div>

              {/* Completed Jars */}
              <div className="bg-white/10 rounded-full w-16 h-16 flex flex-col items-center justify-center transform hover:scale-110 transition-transform duration-300">
                <p className="text-lg font-bold text-yellow-400">{totalJarsCompleted}</p>
                <p className="text-[8px] text-gray-400 text-center leading-tight">
                  Jars
                  <br />
                  Done
                </p>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 text-center animate-fade-in" style={{ animationDelay: "500ms" }}>
              Tap to close
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </>
  )
}
