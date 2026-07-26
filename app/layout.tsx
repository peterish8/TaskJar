import type { Metadata } from "next"
import { Inter } from "next/font/google"
import LocalWorkspaceGate from "./components/local-workspace-gate"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TaskJar Local — Free Client-Side AI Planner",
  description: "A free, private AI task planner with no account, no Supabase, no cloud database, local voice capture, local task planning, and Markdown journey export.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={inter.className}><LocalWorkspaceGate>{children}</LocalWorkspaceGate></body></html>
}
