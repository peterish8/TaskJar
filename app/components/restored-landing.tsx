"use client"

import { Facebook, Instagram, Twitter } from "lucide-react"
import Navbar from "./navbar"
import ShinyText from "../../components/ShinyText"
import AnimatedButton from "../../components/AnimatedButton"
import Particles from "../../components/Particles"

export default function RestoredLanding({ onEnter }: { onEnter: () => void }) {
  return <div className="min-h-screen bg-black text-white overflow-hidden">
    <Navbar onEnter={onEnter}/>
    <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
      <div style={{ width: "100%", height: "100vh", position: "relative" }}><Particles particleColors={["#ffffff", "#ffffff"]} particleCount={200} particleSpread={10} speed={0.1} particleBaseSize={80} sizeRandomness={0.2} moveParticlesOnHover={false} alphaParticles={false} disableRotation={false}/></div>
      <div className="absolute top-20 left-10 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"/>
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-green-400/5 rounded-full blur-3xl"/>
    </div>

    <section className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 md:pt-40 md:pb-32">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center mb-6"><div className="liquid-bubble border border-green-500/30 rounded-full px-4 py-2 backdrop-blur-sm hover:border-green-400/50 transition-all duration-300 relative overflow-hidden"><div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ animation: "colorTransform 3s ease-in-out infinite" }}/><ShinyText text="FREE · LOCAL-FIRST · NO ACCOUNT" speed={3} className="text-xs md:text-sm uppercase tracking-wider font-bold relative z-10 pl-3"/></div></div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight bg-gradient-to-r from-gray-100 via-green-200 to-green-400 bg-clip-text text-transparent">Level Up Your Tasks.</h1>
        <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">Speak or type everything on your mind. TaskJar turns it into a realistic plan using AI that runs in your browser. No login, no Supabase, no cloud database, and no subscription.</p>
        <div className="flex justify-center items-center"><AnimatedButton text="Open Your Local Workspace" onClick={onEnter} className="w-full sm:w-auto"/></div>
        <p className="text-sm mt-6 bg-gradient-to-r from-gray-500 to-green-300 bg-clip-text text-transparent">Your tasks and progress stay in this browser. Raw microphone audio is never uploaded by TaskJar.</p>
      </div>
    </section>

    <section className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48">
      <div className="max-w-6xl mx-auto"><div className="grid md:grid-cols-2 gap-12 items-start">
        <div><ShinyText text="AT TASKJAR WE BELIEVE THAT" speed={3} className="text-sm uppercase tracking-wider mb-4 font-medium"/><h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-gray-300 via-gray-200 to-green-400 bg-clip-text text-transparent">You should be in the pilot&apos;s seat</h2><p className="text-lg mb-8 leading-relaxed bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">AI should organise your thoughts, not own them. Every suggestion is editable, every task is reviewed before saving, and all of your personal productivity data remains under your control on this device.</p><button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="bg-white hover:bg-white/90 text-black font-semibold py-3 px-6 rounded-lg text-base transition-all duration-200">Read our Mission</button></div>
        <div className="flex flex-col gap-8"><div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"><div className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">100%</div><ShinyText text="Client-side task storage" speed={4} className="text-base"/></div><div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"><div className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">₹0</div><ShinyText text="Accounts, subscriptions or database fees" speed={4} className="text-base"/></div></div>
      </div></div>
    </section>

    <section id="features" className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
      <div className="max-w-7xl mx-auto"><div className="text-center mb-12"><ShinyText text="WHY TASKJAR" speed={3} className="text-sm uppercase tracking-wider mb-4 font-medium"/><h2 className="text-4xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-gray-300 via-gray-200 to-green-400 bg-clip-text text-transparent">Everything You Need</h2></div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            ["🎙️","Voice-First Planning","Speak naturally and watch a local speech model turn your words into an editable transcript."],
            ["🤖","On-Device AI","Use small optional Gemma models in the browser, or the built-in offline rules planner without downloading an LLM."],
            ["🏆","Gamified Progress","Complete parent tasks, earn bounded XP, fill jars and track momentum without subtask farming."],
            ["📅","Weekly Planning","Dump your week, review the proposed schedule and save tasks to exact calendar dates."],
            ["🔒","Private by Design","No Supabase, no auth, no cloud database and no TaskJar server storing your personal data."],
            ["📄","Markdown Journey","Export tasks, subtasks, timing, estimates, progress and milestones for Hermes or any AI agent."],
          ].map(([icon,title,description]) => <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300"><div className="text-4xl mb-4">{icon}</div><h4 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">{title}</h4><p className="leading-relaxed text-base bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">{description}</p></div>)}
        </div>
      </div>
    </section>

    <section className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
      <div className="max-w-6xl mx-auto"><div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1"><div className="relative bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm"><div className="space-y-4"><div className="bg-white/5 border border-white/10 p-4 rounded-lg backdrop-blur-sm"><div className="text-sm mb-2 bg-gradient-to-r from-gray-400 to-green-400 bg-clip-text text-transparent">Current Jar</div><div className="text-2xl font-bold mb-2 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">45 / 100 XP</div><div className="w-full bg-white/10 rounded-full h-3"><div className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full" style={{ width: "45%" }}/></div></div><div className="bg-white/5 border border-white/10 p-4 rounded-lg backdrop-blur-sm"><div className="text-sm mb-2 bg-gradient-to-r from-gray-400 to-green-400 bg-clip-text text-transparent">Tasks Completed</div><div className="text-2xl font-bold bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">12</div></div><div className="bg-white/5 border border-white/10 p-4 rounded-lg backdrop-blur-sm"><div className="text-sm mb-2 bg-gradient-to-r from-gray-400 to-green-400 bg-clip-text text-transparent">Storage</div><div className="text-2xl font-bold bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">This browser only</div></div></div></div></div>
        <div className="order-1 md:order-2"><ShinyText text="READY FOR ANY AI AGENT" speed={3} className="text-sm uppercase tracking-wider mb-4 font-medium"/><h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-gray-300 via-gray-200 to-green-400 bg-clip-text text-transparent">Your work, on display</h2><p className="text-lg mb-8 leading-relaxed bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">Your workspace becomes a clean execution history: what you planned, what you finished, what remains, how long it took, and which jars you filled. Export it as Markdown whenever another AI needs context.</p><button onClick={onEnter} className="bg-white hover:bg-white/90 text-black font-semibold py-3 px-6 rounded-lg text-base transition-all duration-200">Open Workspace</button></div>
      </div></div>
    </section>

    <section id="how-it-works" className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
      <div className="max-w-6xl mx-auto"><ShinyText text="ONE PRIVATE WORKFLOW, FOUR SIMPLE STEPS" speed={3} className="text-sm uppercase tracking-wider mb-4 font-medium text-center"/><h2 className="text-4xl md:text-6xl font-bold mb-16 text-center leading-tight bg-gradient-to-r from-gray-300 via-gray-200 to-green-400 bg-clip-text text-transparent">Plan without giving up control</h2>
        <div className="grid md:grid-cols-2 gap-6">{[
          ["1","Open Instantly","No sign-in or profile creation. The workspace opens directly in your browser."],
          ["2","Speak or Type","Capture your day in natural language and edit the transcript before planning."],
          ["3","Review the Plan","Change tasks, subtasks, timing, duration, energy, priority and difficulty before saving."],
          ["4","Complete and Export","Earn XP, fill jars and export the full journey as clean Markdown."],
        ].map(([number,title,description]) => <div key={number} className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300"><div className="text-3xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">{number}</div><h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">{title}</h3><p className="text-base leading-relaxed bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">{description}</p></div>)}</div>
      </div>
    </section>

    <section className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32"><div className="max-w-4xl mx-auto text-center"><h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-gray-300 via-gray-200 to-green-400 bg-clip-text text-transparent">Ready to empty your mind into a plan?</h2><p className="text-lg mb-10 max-w-2xl mx-auto bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">Open TaskJar and start locally. No setup, no account and no payment details.</p><div className="flex flex-col sm:flex-row gap-4 justify-center items-center"><button onClick={onEnter} className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-semibold py-4 px-8 rounded-lg text-base transition-all duration-200">Open Local Workspace</button><button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="w-full sm:w-auto bg-white hover:bg-white/90 text-black font-semibold py-4 px-8 rounded-lg text-base transition-all duration-200">See Features</button></div><p className="text-sm mt-8 bg-gradient-to-r from-gray-400 to-green-300 bg-clip-text text-transparent">Free forever • No credit card • No Supabase • No account</p></div></section>

    <footer className="relative bg-black py-16 px-4 sm:px-6 lg:px-8"><div className="container mx-auto max-w-7xl"><div className="flex flex-col lg:flex-row gap-12 lg:gap-16"><div className="flex-1"><h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">TaskJar helps you to<br/>plan your work<br/>privately.</h2><button onClick={onEnter} className="border border-green-400/60 hover:border-green-400 font-semibold py-3 px-8 rounded-lg text-base transition-all duration-200 bg-transparent"><ShinyText text="Open Workspace" speed={3}/></button></div><div className="flex-1 lg:max-w-2xl"><div className="bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm"><div className="grid grid-cols-3 gap-8 mb-8"><div><h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">Product</h3><ul className="space-y-3 text-sm text-gray-400"><li><a href="#features">Features</a></li><li><a href="#how-it-works">How it works</a></li><li><button onClick={onEnter} className="bg-transparent p-0 text-gray-400">Workspace</button></li></ul></div><div><h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">Privacy</h3><ul className="space-y-3 text-sm text-gray-400"><li>No account</li><li>No database</li><li>Local storage</li></ul></div><div><h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">Export</h3><ul className="space-y-3 text-sm text-gray-400"><li>Markdown</li><li>AI handoff</li><li>Local backup</li></ul></div></div><div className="border-t border-white/10 mb-6"/><div className="flex items-center gap-4"><span className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">TaskJar Local</span><div className="flex items-center gap-4 text-gray-500"><Twitter className="w-5 h-5"/><Facebook className="w-5 h-5"/><Instagram className="w-5 h-5"/></div></div></div></div></div></div></footer>
  </div>
}
