"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ShinyText from "../../components/ShinyText";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [menuVisible, setMenuVisible] = useState(false);

  // Opening: instant border-radius change, smooth menu expansion
  // Closing: instant border-radius change, smooth menu collapse (true reverse of opening)
  useEffect(() => {
    if (navRef.current && glowRef.current) {
      if (isOpen) {
        // Opening: change border-radius instantly, then show menu smoothly
        navRef.current.style.transition = 'background-color 200ms, backdrop-filter 200ms, border-color 200ms, box-shadow 200ms';
        glowRef.current.style.transition = 'none';
        navRef.current.style.borderRadius = '1.5rem';
        glowRef.current.style.borderRadius = '1.5rem';
        setMenuVisible(true);
      } else {
        // Closing: hide menu first, then change border-radius after menu collapse
        setMenuVisible(false);
        setTimeout(() => {
          if (navRef.current && glowRef.current) {
            navRef.current.style.transition = 'background-color 200ms, backdrop-filter 200ms, border-color 200ms, box-shadow 200ms, border-radius 100ms';
            glowRef.current.style.transition = 'border-radius 100ms';
            navRef.current.style.borderRadius = '9999px';
            glowRef.current.style.borderRadius = '9999px';
          }
        }, 200);
      }
    }
  }, [isOpen]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  const navItems = [
    { label: "Features", id: "features" },
    { label: "How It Works", id: "how-it-works" },
  ];

  return (
    <>
      {/* Dynamic Island Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl px-4">
        <div
          ref={navRef}
          className={`relative mx-auto overflow-hidden ${
            scrolled || isOpen
              ? "bg-black/40 backdrop-blur-2xl border border-green-500/20 shadow-2xl shadow-green-500/10"
              : "bg-black/30 backdrop-blur-xl border border-green-500/10 shadow-lg shadow-green-500/5"
          }`}
          style={{
            // Border-radius and transition are controlled by useEffect for smooth animation
          }}
        >
          {/* Green tinted glow effect */}
          <div 
            ref={glowRef}
            className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-green-400/5 to-green-500/5 blur-xl"
            style={{
              // Border-radius and transition are controlled by useEffect
            }}
          ></div>
          
          {/* Content */}
          <div className="relative flex items-center justify-between h-14 md:h-16 px-4 md:px-6">
            {/* Logo */}
            <div
              className="flex items-center gap-2 md:gap-3 cursor-pointer group"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <div className="relative w-8 h-8 md:w-10 md:h-10">
                <div className="relative w-full h-full rounded-lg flex items-center justify-center overflow-hidden">
                  <Image 
                    src="/TaskJarLogo.png" 
                    alt="TaskJar Logo" 
                    width={40} 
                    height={40} 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">
                TaskJar
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSection(item.id!)}
                  className="relative px-4 py-2 text-sm font-medium transition-all duration-300"
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => router.push("/auth")}
                className="relative px-5 py-2 bg-gradient-to-r from-green-600/80 to-green-500/80 hover:from-green-500 hover:to-green-400 text-white text-sm font-semibold rounded-full transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden relative p-2 text-gray-300 hover:text-green-400 transition-colors duration-300"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile Menu - Expands from Dynamic Island */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              menuVisible ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-4 pb-4 pt-2 border-t border-green-500/10 mt-2">
              <div className="flex flex-col gap-2">
                {navItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      scrollToSection(item.id!);
                      setIsOpen(false);
                    }}
                    className="relative px-4 py-3 text-left text-sm font-medium bg-gradient-to-r from-gray-300 via-gray-200 to-green-300 bg-clip-text text-transparent hover:from-green-300 hover:to-green-400 rounded-lg transition-all duration-300"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    router.push("/auth");
                    setIsOpen(false);
                  }}
                  className="relative mt-2 px-6 py-3 bg-gradient-to-r from-green-600/80 to-green-500/80 hover:from-green-500 hover:to-green-400 text-white text-sm font-semibold rounded-full transition-all duration-300 shadow-lg shadow-green-500/30"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-20 md:h-24"></div>
    </>
  );
}

