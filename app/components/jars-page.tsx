"use client"

import { useState } from "react"
import { Trophy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import JarVisualization from "./jar-visualization"
import CompletedJarModal from "./completed-jar-modal"
import type { Jar, AppSettings, Task } from "../types"

interface JarsPageProps {
  jars: Jar[]
  currentJar: Jar | null
  settings: AppSettings
  tasks: Task[]
}

export default function JarsPage({ jars, currentJar, settings, tasks }: JarsPageProps) {
  const [selectedJar, setSelectedJar] = useState<Jar | null>(null)
  const completedJars = jars.filter((jar) => jar.completed)

  return (
    <>
      <div className="space-y-12">
        {/* Current Jar */}
        {currentJar && (
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-8 text-green-300 matrix-font">Current Jar</h3>
            <div className="flex justify-center mb-16">
              <JarVisualization jar={currentJar} size="large" settings={settings} />
            </div>
          </div>
        )}
        {/* Completed Jars */}
        {completedJars.length > 0 ? (
          <div>
            <h3 className="text-xl font-semibold mb-8 text-center text-yellow-300 matrix-font">Completed Jars</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {completedJars.map((jar) => (
                <Card
                  key={jar.id}
                  className="bg-white/10 backdrop-blur-md border-white/20 p-4 cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => setSelectedJar(jar)}
                >
                  <CardContent className="p-0 text-center">
                    <JarVisualization jar={jar} size="large" settings={settings} />
                    <div className="mt-16">
                      <h4 className="font-semibold mb-1">{jar.name || `Jar ${jar.id.slice(-4)}`}</h4>
                      <p className="text-xs text-gray-300 mb-2">{new Date(jar.completedAt!).toLocaleDateString()}</p>
                      <Badge className="bg-green-600 text-xs">{jar.tasks.length} tasks</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-300">No completed jars yet. Keep completing tasks to fill your first jar!</p>
            </CardContent>
          </Card>
        )}
      </div>

      <CompletedJarModal
        isOpen={!!selectedJar}
        onClose={() => setSelectedJar(null)}
        jar={selectedJar}
        tasks={tasks}
      />
    </>
  )
}
