"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Loader2 } from "lucide-react"
import LocalLanding from "./local-landing"

const ENTERED_KEY = "taskjar_entered"

export default function LocalWorkspaceGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"checking" | "landing" | "workspace">("checking")

  useEffect(() => {
    setState(localStorage.getItem(ENTERED_KEY) === "1" ? "workspace" : "landing")
  }, [])

  if (state === "checking") return <main className="loading"><Loader2 className="spin"/></main>
  if (state === "landing") return <LocalLanding onEnter={() => { localStorage.setItem(ENTERED_KEY, "1"); setState("workspace") }}/>
  return children
}
