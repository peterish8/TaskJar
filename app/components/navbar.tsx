"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Menu, X } from "lucide-react"

export default function Navbar({ onEnter }: { onEnter: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!navRef.current || !glowRef.current) return
    if (isOpen) {
      navRef.current.style.transition = "background-color 200ms, backdrop-filter 200ms, border-color 200ms, box-shadow 200ms"
      glowRef.current.style.transition = "none"
      navRef.current.style.borderRadius = "1.5rem"
      glowRef.current.style.borderRadius = "1.5rem"
      setMenuVisible(true)
    } else {
      setMenuVisible(false)
      const timer = window.setTimeout(() => {
        if (!navRef.current || !glowRef.current) return
        navRef.current.style.transition = "background-color 200ms, backdrop-filter 200ms, border-color 200ms, box-shadow 200ms, border-radius 100ms"
        glowRef.current.style.transition = "border-radius 100ms"
        navRef.current.style.borderRadius = "9999px"
        glowRef.current.style.borderRadius = "9999px"
      }, 200)
      return () => window.clearTimeout(timer)
    }
  }, [isOpen])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setIsOpen(false)
  }

  return <>
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl px-4">
      <div ref={navRef} className={`relative mx-auto overflow-hidden ${scrolled || isOpen ? "bg-black/40 backdrop-blur-2xl border border-green-500/20 shadow-2xl shadow-green-500/10" : "bg-black/30 backdrop-blur-xl border border-green-500/10 shadow-lg shadow-green-500/5"}`} style={{ borderRadius: "9999px" }}>
        <div ref={glowRef} className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-green-400/5 to-green-500/5 blur-xl" style={{ borderRadius: "9999px" }}/>
        <div className="relative flex items-center justify-between h-14 md:h-16 px-4 md:px-6">
          <button className="flex items-center gap-2 md:gap-3 group bg-transparent p-0" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden"><Image src="/TaskJarLogo.png" alt="TaskJar Logo" fill className="object-contain"/></div>
            <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">TaskJar</span>
          </button>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection("features")} className="relative px-4 py-2 text-sm font-medium transition-all duration-300 bg-transparent text-white">Features</button>
            <button onClick={() => scrollToSection("how-it-works")} className="relative px-4 py-2 text-sm font-medium transition-all duration-300 bg-transparent text-white">How It Works</button>
            <button onClick={onEnter} className="relative px-5 py-2 bg-gradient-to-r from-green-600/80 to-green-500/80 hover:from-green-500 hover:to-green-400 text-white text-sm font-semibold rounded-full transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105">Open Workspace</button>
          </div>
          <button onClick={() => setIsOpen((value) => !value)} className="md:hidden relative p-2 text-gray-300 hover:text-green-400 transition-colors duration-300 bg-transparent" aria-label="Toggle menu">{isOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}</button>
        </div>
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuVisible ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="px-4 pb-4 pt-2 border-t border-green-500/10 mt-2"><div className="flex flex-col gap-2">
            <button onClick={() => scrollToSection("features")} className="relative px-4 py-3 text-left text-sm font-medium bg-gradient-to-r from-gray-300 via-gray-200 to-green-300 bg-clip-text text-transparent rounded-lg">Features</button>
            <button onClick={() => scrollToSection("how-it-works")} className="relative px-4 py-3 text-left text-sm font-medium bg-gradient-to-r from-gray-300 via-gray-200 to-green-300 bg-clip-text text-transparent rounded-lg">How It Works</button>
            <button onClick={() => { onEnter(); setIsOpen(false) }} className="relative mt-2 px-6 py-3 bg-gradient-to-r from-green-600/80 to-green-500/80 text-white text-sm font-semibold rounded-full shadow-lg shadow-green-500/30">Open Workspace</button>
          </div></div>
        </div>
      </div>
    </nav>
    <div className="h-20 md:h-24"/>
  </>
}
