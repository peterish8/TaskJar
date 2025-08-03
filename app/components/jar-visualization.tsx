"use client"

import type { Jar, AppSettings } from "../types"

interface JarVisualizationProps {
  jar: Jar
  size?: "small" | "large"
  settings?: AppSettings
}

export default function JarVisualization({ jar, size = "large", settings }: JarVisualizationProps) {
  const targetXP = jar.completed ? jar.targetXP : settings?.jarTarget || jar.targetXP || 100
  const fillPercentage = (jar.currentXP / targetXP) * 100
  const isSmall = size === "small"

  return (
    <div className={`relative ${isSmall ? "w-16 h-20" : "w-32 h-40"} mx-auto`}>
      {/* Jar Outline */}
      <div
        className={`absolute inset-0 ${isSmall ? "border-2" : "border-4"} border-white/30 rounded-b-full bg-transparent`}
      >
        {/* Jar Neck */}
        <div
          className={`absolute ${isSmall ? "-top-2 left-1/2 transform -translate-x-1/2 w-6 h-3 border-2" : "-top-4 left-1/2 transform -translate-x-1/2 w-12 h-6 border-4"} border-white/30 border-b-0 rounded-t-lg bg-black`}
        ></div>

        {/* Liquid Container - Clipped to jar shape */}
        <div className="absolute inset-0 rounded-b-full overflow-hidden">
          {/* Liquid Fill */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-400 to-green-300 rounded-b-full transition-all duration-1000 ease-out"
            style={{ height: `${fillPercentage}%` }}
          >
            {/* Liquid Surface Animation */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-200 opacity-60 animate-pulse"></div>
          </div>
        </div>

        {/* Jar Shine Effect */}
        <div
          className={`absolute ${isSmall ? "top-1 left-1 w-2 h-4" : "top-2 left-2 w-4 h-8"} bg-white/20 rounded-full blur-sm`}
        ></div>
      </div>

      {/* XP Label - Positioned further below jar to avoid collision */}
      {!isSmall && (
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center w-full">
          <p className="text-sm text-white font-medium">
            {jar.currentXP}/{targetXP} XP
          </p>
          <p className="text-xs text-gray-400">{Math.round(fillPercentage)}% Full</p>
        </div>
      )}
    </div>
  )
}
