"use client"

import { DatabaseZap, Home, LockKeyhole, Sparkles, WalletCards } from "lucide-react"

export default function LocalLanding({ onEnter }: { onEnter: () => void }) {
  return <main className="landing"><div>
    <Sparkles size={42}/>
    <p className="eyebrow">TASKJAR LOCAL · FREE FOREVER</p>
    <h1>Speak your day. Keep every detail on your device.</h1>
    <p>TaskJar is a completely client-side AI task planner. There is no Supabase, no account, no cloud database, no subscription, and no server storing your tasks. Your microphone audio, tasks, progress, jars, settings, and exports stay inside this browser.</p>
    <div className="landing-proof" aria-label="TaskJar privacy and pricing highlights">
      <span><LockKeyhole/> No login or auth</span>
      <span><DatabaseZap/> No Supabase or database</span>
      <span><WalletCards/> Free to use</span>
    </div>
    <p className="landing-note">Optional speech and planning models download from public model hosts once, then run locally. Personal task data and raw microphone audio are never uploaded by TaskJar.</p>
    <button onClick={onEnter}>Open my local workspace <Home size={17}/></button>
  </div></main>
}
