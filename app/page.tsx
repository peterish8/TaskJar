"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  SettingsIcon,
  Trophy,
  Calendar,
  LineChart,
  Twitter,
  Facebook,
  Instagram,
} from "lucide-react";

import TodoPage from "./components/todo-page";
import JarsPage from "./components/jars-page";
import SettingsPage from "./components/settings-page";
import WeeklyDumpPage from "./components/weekly-dump-page";
import HistoryModal from "./components/history-modal";
import AddTaskModal from "./components/add-task-modal";
import Navbar from "./components/navbar";
import ShinyText from "../components/ShinyText";
import AnimatedButton from "../components/AnimatedButton";
import Particles from "../components/Particles";
import { PlusCircle } from "lucide-react";
import type { AppSettings, Task, Jar } from "./types";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

import { useSupabaseData } from "../lib/use-supabase-data";
import React, { lazy, Suspense } from "react";
const AnalyticsPage = lazy(() => import("./analytics/page"));

export default function TaskJarApp() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "todo" | "jars" | "settings" | "dump" | "analytics"
  >("todo");
  const [currentJar, setCurrentJar] = useState<Jar | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);


  // Use Supabase data hook
  const {
    isLoading: dataLoading,
    error: dataError,
    settings,
    tasks,
    jars,
    weeklyTasks,
    archivedWeeks,
    updateSettings,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    addJar,
    updateJar,
    deleteJar,
    addTaskToJar,
    removeTaskFromJar,
    addWeeklyTask,
    updateWeeklyTask,
    deleteWeeklyTask,
    completeWeeklyTask,
    archiveWeek,
    updateDailyCompletion,
    getTodayCompletion,
  } = useSupabaseData();

  // Track completion for analytics - use Supabase data
  useEffect(() => {
    const updateCompletion = async () => {
      if (!user || dataLoading) return;

    const today = new Date().toISOString().split("T")[0];
    const todayTasks = tasks.filter((task) => {
      const taskDate = task.scheduledFor
        ? new Date(task.scheduledFor).toISOString().split("T")[0]
          : today;
      return taskDate === today;
    });

      if (todayTasks.length === 0) return;

    const completedTasks = todayTasks.filter((task) => task.completed);
      const completionPct = Math.round(
        (completedTasks.length / todayTasks.length) * 100
      );

      await updateDailyCompletion(completionPct);
    };

    updateCompletion();
  }, [tasks, user, dataLoading, updateDailyCompletion]);

  // Redirect authenticated users from landing to app
  useEffect(() => {
    if (!loading && user) {
      // User is authenticated, stay on main app
      return;
    }
  }, [user, loading]);

  // All useEffect hooks at the top
  useEffect(() => {
    setIsHydrated(true);
  }, []);




  // Wait for both auth and data loading to complete
  const isAppLoading = loading || dataLoading || !isHydrated;

  // Data loading is now handled by useSupabaseData hook
  // Current jar management
  useEffect(() => {
    if (!user || dataLoading) return;

    const current = jars.find((jar) => !jar.completed);
      if (current) {
        // Ensure current jar has the correct target from settings
      if (current.targetXP !== settings.jarTarget) {
        updateJar(current.id, { targetXP: settings.jarTarget });
      }
      setCurrentJar(current);
    } else {
      // Create a new jar if none exist or all are completed
      const newJarData = {
        name: "My Jar",
        currentXP: 0,
        targetXP: settings.jarTarget,
        completed: false,
        tasks: [],
      };
      addJar(newJarData)
        .then((newJar) => {
          if (newJar) {
      setCurrentJar(newJar);
          }
        })
        .catch((error) => {
          console.error("Failed to create jar:", error);
        });
    }
  }, [jars, settings.jarTarget, user, dataLoading, addJar, updateJar]);

  // Data persistence is now handled by Supabase - no need for localStorage sync

  useEffect(() => {
    if (
      currentJar &&
      !currentJar.completed &&
      currentJar.targetXP !== settings.jarTarget
    ) {
      const updatedJar = { ...currentJar, targetXP: settings.jarTarget };
      setCurrentJar(updatedJar);
      updateJar(currentJar.id, { targetXP: settings.jarTarget });
    }
  }, [settings.jarTarget, currentJar, updateJar]);

  // Conditional rendering after all hooks
  if (!isHydrated || isAppLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
          <div className="text-green-400 text-xl font-semibold">
            Loading TaskJar...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Show landing page for unauthenticated users
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Dynamic Island Navbar */}
        <Navbar />
        
        {/* Particle Background */}
        <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
          <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <Particles
              particleColors={['#ffffff', '#ffffff']}
              particleCount={200}
              particleSpread={10}
              speed={0.1}
              particleBaseSize={80}
              sizeRandomness={0.2}
              moveParticlesOnHover={false}
              alphaParticles={false}
              disableRotation={false}
            />
          </div>
          {/* Subtle Glowing Orbs */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-green-400/5 rounded-full blur-3xl"></div>
        </div>

        {/* Hero Section - Pangea Style */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 md:pt-40 md:pb-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Small Label - Bubble Container */}
            <div className="inline-flex items-center justify-center mb-6">
              <div className="liquid-bubble border border-green-500/30 rounded-full px-4 py-2 backdrop-blur-sm hover:border-green-400/50 transition-all duration-300 relative overflow-hidden">
                {/* Animated color-transforming dot inside container */}
                <div 
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                  style={{
                    animation: 'colorTransform 3s ease-in-out infinite'
                  }}
                ></div>
                <ShinyText 
                  text="TURN PRODUCTIVITY INTO A GAME" 
                  speed={3}
                  className="text-xs md:text-sm uppercase tracking-wider font-bold relative z-10 pl-3"
                />
              </div>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight bg-gradient-to-r from-gray-100 via-green-200 to-green-400 bg-clip-text text-transparent">
              Level Up Your Tasks.
            </h1>
            
            {/* Description */}
            <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
              Create your profile today and take control of your productivity. It's 100% free to join. No commission fees ever.
            </p>
            
            {/* Button */}
            <div className="flex justify-center items-center">
              <AnimatedButton
                text="Create Your Profile"
                onClick={() => router.push('/auth')}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>

        {/* "Pilot's Seat" Section - Pangea Style */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              {/* Left Side - Content */}
              <div>
                <ShinyText 
                  text="AT TASKJAR WE BELIEVE THAT" 
                  speed={3}
                  className="text-sm uppercase tracking-wider mb-4 font-medium"
                  style={{ color: 'inherit' }}
                />
                <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-gray-300 via-gray-200 to-green-400 bg-clip-text text-transparent">
                  You should be in the pilot's seat
                </h2>
                <p className="text-lg mb-8 leading-relaxed bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
                  The balance of productivity needs to change. That's why we built TaskJar, a platform that gives you control over your tasks. You get to choose your priorities, set your goals, and track your progress—all while earning XP and filling jars without any platform fees.
                </p>
                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({behavior: 'smooth'})}
                  className="bg-white hover:bg-white/90 text-black font-semibold py-3 px-6 rounded-lg text-base transition-all duration-200"
                >
                  Read our Mission
                </button>
              </div>
              
              {/* Right Side - Statistics */}
              <div className="flex flex-col gap-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">1,000+</div>
                  <ShinyText 
                    text="Tasks completed daily" 
                    speed={4}
                    className="text-base"
                  />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">$2M+</div>
                  <ShinyText 
                    text="XP earned by users" 
                    speed={4}
                    className="text-base"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section - Simplified Grid */}
        <div id="features" className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <ShinyText 
                text="WHY TASKJAR" 
                speed={3}
                className="text-sm uppercase tracking-wider mb-4 font-medium"
                style={{ color: 'inherit' }}
              />
              <h2 className="text-4xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-gray-300 via-gray-200 to-green-400 bg-clip-text text-transparent">
                Everything You Need
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300">
              <div className="text-4xl mb-4">🤖</div>
              <h4 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">
                AI Task Generation
              </h4>
              <p className="leading-relaxed text-base bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
                Describe your goals in natural language and let AI break them down into actionable tasks with smart priorities.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300">
              <div className="text-4xl mb-4">🏆</div>
              <h4 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">
                Gamified Progress
              </h4>
              <p className="leading-relaxed text-base bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
                Earn XP for completing tasks and fill up jars. Watch your productivity visualized in a fun, motivating way.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300">
              <div className="text-4xl mb-4">📅</div>
              <h4 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">
                Weekly Planning
              </h4>
              <p className="leading-relaxed text-base bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
                Dump your entire week's thoughts and let AI organize them into a structured daily schedule automatically.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">
                Analytics Dashboard
              </h4>
              <p className="leading-relaxed text-base bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
                Track completion rates, streaks, and productivity patterns with detailed analytics and insights.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">
                Smart Prioritization
              </h4>
              <p className="leading-relaxed text-base bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
                Tasks automatically categorized by priority and difficulty for optimal workflow management.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">
                Goal Tracking
              </h4>
              <p className="leading-relaxed text-base bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
                Set XP targets, track your jars collection, and celebrate milestones as you complete tasks.
              </p>
            </div>
          </div>
          </div>
        </div>

        {/* "Your Work, on Display" Section - Pangea Style */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Side - Visual/Graphic */}
              <div className="order-2 md:order-1">
                <div className="relative bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-lg backdrop-blur-sm">
                      <div className="text-sm mb-2 bg-gradient-to-r from-gray-400 to-green-400 bg-clip-text text-transparent">Current Jar</div>
                      <div className="text-2xl font-bold mb-2 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">450 / 1000 XP</div>
                      <div className="w-full bg-white/10 rounded-full h-3">
                        <div className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full" style={{width: '45%'}}></div>
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-lg backdrop-blur-sm">
                      <div className="text-sm mb-2 bg-gradient-to-r from-gray-400 to-green-400 bg-clip-text text-transparent">Tasks Completed</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">127</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-lg backdrop-blur-sm">
                      <div className="text-sm mb-2 bg-gradient-to-r from-gray-400 to-green-400 bg-clip-text text-transparent">Current Streak</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">🔥 12 days</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Content */}
              <div className="order-1 md:order-2">
                <ShinyText 
                  text="SHAREABLE WITH ANYONE" 
                  speed={3}
                  className="text-sm uppercase tracking-wider mb-4 font-medium"
                />
                <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-gray-300 via-gray-200 to-green-400 bg-clip-text text-transparent">
                  Your work, on display
                </h2>
                <p className="text-lg mb-8 leading-relaxed bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
                  One central hub for everything you've accomplished. Let your progress speak for itself—track your XP, completed tasks, and jar collections. It's a productivity dashboard, achievement tracker, and goal visualizer, all in one.
                </p>
                <button
                  onClick={() => router.push('/auth')}
                  className="bg-white hover:bg-white/90 text-black font-semibold py-3 px-6 rounded-lg text-base transition-all duration-200"
                >
                  Create Your Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* "How It Works" Section - Pangea Style */}
        <div id="how-it-works" className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-6xl mx-auto">
            <ShinyText 
              text="THOUSANDS OF TASKS, 3 WAYS TO CONNECT" 
              speed={3}
              className="text-sm uppercase tracking-wider mb-4 font-medium text-center"
            />
            <h2 className="text-4xl md:text-6xl font-bold mb-16 text-center leading-tight bg-gradient-to-r from-gray-300 via-gray-200 to-green-400 bg-clip-text text-transparent">
              Expand the way you find work
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300">
                <div className="text-3xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">1</div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">Sign In with Google</h3>
                <p className="text-base leading-relaxed bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
                  Quick and secure authentication to get started in seconds.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300">
                <div className="text-3xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">2</div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">Add Tasks with AI</h3>
                <p className="text-base leading-relaxed bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
                  Type what you need to do in plain English, and AI generates structured tasks.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300">
                <div className="text-3xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">3</div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">Complete & Earn XP</h3>
                <p className="text-base leading-relaxed bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
                  Check off tasks to earn XP based on difficulty and fill up your jars.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300">
                <div className="text-3xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">4</div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">Track Your Progress</h3>
                <p className="text-base leading-relaxed bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
                  View analytics, maintain streaks, and watch your productivity soar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA Section - Pangea Style */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-gray-300 via-gray-200 to-green-400 bg-clip-text text-transparent">
              Ready to transform your productivity?
            </h2>
            <p className="text-lg mb-10 max-w-2xl mx-auto bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">
              Join thousands of users who are taking control of their tasks with TaskJar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => router.push('/auth')}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-semibold py-4 px-8 rounded-lg text-base transition-all duration-200"
              >
                Create Your Profile
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="w-full sm:w-auto bg-white hover:bg-white/90 text-black font-semibold py-4 px-8 rounded-lg text-base transition-all duration-200"
              >
                Get Started Free
              </button>
            </div>
            <p className="text-sm mt-8 bg-gradient-to-r from-gray-400 to-green-300 bg-clip-text text-transparent">No credit card required • Free forever</p>
          </div>
        </div>

        {/* Footer - Landingfolio Style */}
        <div className="relative bg-black py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
              {/* Left Section - Tagline and CTA */}
              <div className="flex-1">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  TaskJar helps you to<br />
                  grow your productivity<br />
                  fast.
                </h2>
                <button
                  onClick={() => router.push('/auth')}
                  className="border border-green-400/60 hover:border-green-400 font-semibold py-3 px-8 rounded-lg text-base transition-all duration-200 bg-transparent"
                >
                  <ShinyText 
                    text="Start Free Trial" 
                    speed={3}
                    className=""
                  />
                </button>
              </div>

              {/* Right Section - Navigation and Social */}
              <div className="flex-1 lg:max-w-2xl">
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
                  {/* Navigation Columns */}
                  <div className="grid grid-cols-3 gap-8 mb-8">
                    {/* Platform Column */}
                    <div>
                      <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">Platform</h3>
                      <ul className="space-y-3">
                        <li><a href="#features" className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent hover:from-green-300 hover:to-green-400 transition-all">About</a></li>
                        <li><a href="#features" className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent hover:from-green-300 hover:to-green-400 transition-all">Features</a></li>
                        <li><a href="#how-it-works" className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent hover:from-green-300 hover:to-green-400 transition-all">Pricing & Plans</a></li>
                        <li><a href="#features" className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent hover:from-green-300 hover:to-green-400 transition-all">Contact</a></li>
                      </ul>
                    </div>

                    {/* Resources Column */}
                    <div>
                      <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">Resources</h3>
                      <ul className="space-y-3">
                        <li><a href="/auth" className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent hover:from-green-300 hover:to-green-400 transition-all">Account</a></li>
                        <li><a href="#features" className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent hover:from-green-300 hover:to-green-400 transition-all">Tools</a></li>
                        <li><a href="#features" className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent hover:from-green-300 hover:to-green-400 transition-all">Newsletter</a></li>
                        <li><a href="#features" className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent hover:from-green-300 hover:to-green-400 transition-all">FAQ</a></li>
                      </ul>
                    </div>

                    {/* Legals Column */}
                    <div>
                      <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-gray-200 via-green-300 to-green-400 bg-clip-text text-transparent">Legals</h3>
                      <ul className="space-y-3">
                        <li><a href="#features" className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent hover:from-green-300 hover:to-green-400 transition-all">Guides</a></li>
                        <li><a href="#features" className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent hover:from-green-300 hover:to-green-400 transition-all">Terms & Conditions</a></li>
                        <li><a href="#features" className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent hover:from-green-300 hover:to-green-400 transition-all">Privacy Policy</a></li>
                        <li><a href="#features" className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent hover:from-green-300 hover:to-green-400 transition-all">Licensing</a></li>
                      </ul>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-white/10 mb-6"></div>

                  {/* Social Media */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm bg-gradient-to-r from-gray-400 via-gray-300 to-green-300 bg-clip-text text-transparent">Follow us on:</span>
                    <div className="flex items-center gap-4">
                      <a href="#" className="text-gray-400 hover:text-green-400 transition-colors" aria-label="Twitter">
                        <Twitter className="w-5 h-5" />
                      </a>
                      <a href="#" className="text-gray-400 hover:text-green-400 transition-colors" aria-label="Facebook">
                        <Facebook className="w-5 h-5" />
                      </a>
                      <a href="#" className="text-gray-400 hover:text-green-400 transition-colors" aria-label="Instagram">
                        <Instagram className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if data loading failed
  if (dataError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4 font-semibold">
            Failed to load data
          </div>
          <div className="text-gray-400 mb-6">{dataError}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Sound effects
  const playSound = (type: "click" | "complete" | "generate") => {
    if (!settings.preferences.soundEnabled) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case "click":
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          600,
          audioContext.currentTime + 0.1
        );
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.1
        );
        break;
      case "complete":
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(
          659,
          audioContext.currentTime + 0.1
        );
        oscillator.frequency.setValueAtTime(
          784,
          audioContext.currentTime + 0.2
        );
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3
        );
        break;
      case "generate":
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          880,
          audioContext.currentTime + 0.2
        );
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.2
        );
        break;
    }

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  // Complete task with jar logic
  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentJar) return;

    playSound("complete");

    // Complete the task
    await completeTask(taskId);

    // Add task to current jar
    await addTaskToJar(currentJar.id, taskId);

    // Update jar XP
    const newXP = currentJar.currentXP + task.xpValue;
    const jarUpdates: Partial<Jar> = {
      currentXP: newXP,
    };

    if (newXP >= currentJar.targetXP) {
      // Complete current jar
      jarUpdates.completed = true;
      jarUpdates.completedAt = Date.now();
      jarUpdates.currentXP = currentJar.targetXP;

      await updateJar(currentJar.id, jarUpdates);

      // Create new jar with overflow XP
      const overflowXP = newXP - currentJar.targetXP;
      const newJarData = {
        name: "My Jar",
        currentXP: overflowXP,
        targetXP: settings.jarTarget,
        completed: false,
        tasks: [],
      };

      const newJar = await addJar(newJarData);
      if (newJar) {
      setCurrentJar(newJar);
      }
    } else {
      // Just update current jar
      await updateJar(currentJar.id, jarUpdates);
      setCurrentJar({ ...currentJar, ...jarUpdates });
    }
  };

  const handleAddTask = async (
    task: Omit<Task, "id" | "completed" | "completedAt" | "createdAt">
  ) => {
    try {
      await addTask({
      ...task,
      completed: false,
      completedAt: undefined,
      });
      playSound("generate");
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const handleAddTasks = async (
    tasks: Omit<Task, "id" | "completed" | "completedAt" | "createdAt">[]
  ) => {
    try {
      for (const task of tasks) {
        await addTask({
          ...task,
          completed: false,
          completedAt: undefined,
          scheduledFor: undefined, // Ensure no scheduledFor date
        });
      }
      playSound("generate");
    } catch (error) {
      console.error("Failed to add tasks:", error);
    }
  };

  const handleNavigation = (
    section: "todo" | "jars" | "settings" | "dump" | "analytics"
  ) => {
    setActiveSection(section);
    playSound("click");
  };

  // Delete task from history
  const deleteTaskFromHistory = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    playSound("click");
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Clear all data - Note: This is a destructive operation in Supabase
  const clearAllData = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL your tasks and jars? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Delete all tasks and jars from Supabase
      // Note: This is a simplified version - in production you'd want more careful deletion
      for (const task of tasks) {
        await deleteTask(task.id);
      }
      for (const jar of jars) {
        await deleteJar(jar.id);
      }

      // Create a new jar
      const newJar = await addJar({
        name: "My Jar",
      currentXP: 0,
      targetXP: settings.jarTarget,
      completed: false,
      tasks: [],
      });
      if (newJar) {
    setCurrentJar(newJar);
      }

    playSound("click");
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          {activeSection === "todo" ? (
            // Remove this entire section - no header for todo page
            <></>
          ) : activeSection === "jars" ? (
            <>
              <h2 className="text-2xl font-bold text-white matrix-font-large">
                Jar Collection
              </h2>
              <p className="text-gray-400 text-sm italic mt-1">
                AI-Powered Todo List by prats
              </p>
            </>
          ) : activeSection === "settings" ? (
            <></>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white matrix-font-large">
                Weekly Dump
              </h2>
              <p className="text-gray-400 text-sm italic mt-1">
                AI-Powered Todo List by prats
              </p>
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

        {/* Main Content */}
        {activeSection === "todo" && (
          <TodoPage
            tasks={tasks}
            updateTask={updateTask}
            addTasks={handleAddTasks}
            settings={settings}
            completeTask={handleCompleteTask}
            deleteTask={deleteTask}
            playSound={playSound}
          />
        )}

        {activeSection === "jars" && (
          <JarsPage
            jars={jars}
            currentJar={currentJar}
            settings={settings}
            tasks={tasks}
          />
        )}

        {activeSection === "settings" && (
          <SettingsPage
            settings={settings}
            updateSettings={updateSettings}
            playSound={playSound}
            onClearAllData={clearAllData}
          />
        )}
        {activeSection === "analytics" && (
          <Suspense
            fallback={
              <div className="text-center p-8">Loading Analytics...</div>
            }
          >
            <AnalyticsPage />
          </Suspense>
        )}
        {activeSection === "dump" && (
          <WeeklyDumpPage
            settings={settings}
            weeklyTasks={weeklyTasks}
            addWeeklyTask={addWeeklyTask}
            updateWeeklyTask={updateWeeklyTask}
            deleteWeeklyTask={deleteWeeklyTask}
            completeWeeklyTask={completeWeeklyTask}
            archivedWeeks={archivedWeeks}
            archiveWeek={archiveWeek}
            handleAddTasks={handleAddTasks}
            playSound={playSound}
          />
        )}
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
                activeSection === "todo"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleNavigation("jars")}
              className={`p-3 rounded-full transition-all duration-300 ${
                activeSection === "jars"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Trophy className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleNavigation("dump")}
              className={`p-3 rounded-full transition-all duration-300 ${
                activeSection === "dump"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Calendar className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleNavigation("analytics")}
              className={`p-3 rounded-full transition-all duration-300 ${
                activeSection === "analytics"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              aria-label="Analytics"
            >
              <LineChart className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleNavigation("settings")}
              className={`p-3 rounded-full transition-all duration-300 ${
                activeSection === "settings"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              aria-label="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
