"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSupabaseData } from "../../lib/use-supabase-data";
import type { Task } from "../types";
import MotivationCard from "./components/MotivationCard";
import OnboardingCards from "./components/OnboardingCards";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";

function heatColor(pct: number): string {
  if (pct === 0) return "bg-gray-200 dark:bg-neutral-800";
  if (pct < 34) return "bg-yellow-200 dark:bg-yellow-700/50";
  if (pct < 67) return "bg-yellow-400 dark:bg-yellow-600";
  return "bg-green-500 dark:bg-green-600";
}

const COLORS = [
  "#1DB954",
  "#F59E0B",
  "#EF4444",
  "#6366F1",
  "#10B981",
  "#F97316",
  "#EC4899",
];

// Calculate completion percentage for a given date
function calculateDailyCompletion(tasks: Task[], date: string): number {
  const dateStr = date.split('T')[0];
  const dayStart = new Date(dateStr).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;

  // Get tasks created on this date (not scheduled for future)
  const dayTasks = tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    const taskDateStr = taskDate.toISOString().split('T')[0];
    return taskDateStr === dateStr && !task.scheduledFor;
  });

  if (dayTasks.length === 0) return 0;

  const completed = dayTasks.filter(task => task.completed && task.completedAt).length;
  return Math.round((completed / dayTasks.length) * 100);
}

// Calculate streak from tasks
function calculateStreak(tasks: Task[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      const taskDateStr = taskDate.toISOString().split('T')[0];
      return taskDateStr === dateStr && !task.scheduledFor;
    });

    if (dayTasks.length === 0) {
      // If no tasks on this day, check if it's today - if so, don't break streak
      if (currentDate.getTime() === today.getTime()) {
        break;
      }
      // If past day with no tasks, streak continues
      currentDate.setDate(currentDate.getDate() - 1);
      continue;
    }

    const completed = dayTasks.filter(task => task.completed).length;
    const completionPct = (completed / dayTasks.length) * 100;

    if (completionPct > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // If today has no completion, don't count it in streak
      if (currentDate.getTime() === today.getTime()) {
        break;
      }
      // Past day with no completion breaks streak
      break;
    }
  }

  return streak;
}

// Get last N days of completion data
function getLastNDaysCompletion(tasks: Task[], days: number): Array<{ dateISO: string; completionPct: number }> {
  const result: Array<{ dateISO: string; completionPct: number }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const completionPct = calculateDailyCompletion(tasks, dateStr);
    result.push({ dateISO: dateStr, completionPct });
  }

  return result;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { tasks, getTodayCompletion } = useSupabaseData();
  const [todayCompletion, setTodayCompletion] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayCompletion = async () => {
      if (user) {
        const completion = await getTodayCompletion();
        setTodayCompletion(completion);
      }
      setLoading(false);
    };
    fetchTodayCompletion();
  }, [user, getTodayCompletion]);

  // Calculate metrics from real task data
  const metrics = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        todayPct: 0,
        streak: 0,
        avg7d: 0,
        last7: [],
        last30: [],
        completedTasks: [],
        priorities: { High: 0, Medium: 0, Low: 0 },
        difficulties: { Easy: 0, Moderate: 0, Hard: 0 },
        hours: Array(24).fill(0),
        totalTasks: 0,
      };
    }

    // Get completed tasks
    const completedTasks = tasks.filter(t => t.completed && t.completedAt);

    // Calculate today's completion
    const today = new Date().toISOString().split('T')[0];
    const todayPct = calculateDailyCompletion(tasks, today);

    // Calculate streak
    const streak = calculateStreak(tasks);

    // Get last 7 and 30 days data
    const last7 = getLastNDaysCompletion(tasks, 7);
    const last30 = getLastNDaysCompletion(tasks, 30);

    // Calculate 7-day average
    const avg7d = last7.length > 0
      ? Math.round(last7.reduce((sum, day) => sum + day.completionPct, 0) / last7.length)
      : 0;

    // Analyze completed tasks
    const priorities = { High: 0, Medium: 0, Low: 0 };
    const difficulties = { Easy: 0, Moderate: 0, Hard: 0 };
    const hours: number[] = Array(24).fill(0);

    completedTasks.forEach(task => {
      // Priority breakdown
      if (task.priority === 'urgent') priorities.High++;
      else if (task.priority === 'scheduled') priorities.Medium++;
      else priorities.Low++;

      // Difficulty breakdown
      if (task.difficulty === 'challenging') difficulties.Hard++;
      else if (task.difficulty === 'standard') difficulties.Moderate++;
      else difficulties.Easy++;

      // Hour of completion
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours();
        hours[hour]++;
      }
    });

    return {
      todayPct: todayCompletion || todayPct,
      streak,
      avg7d,
      last7,
      last30,
      completedTasks,
      priorities,
      difficulties,
      hours,
      totalTasks: tasks.length,
    };
  }, [tasks, todayCompletion]);

  // Heatmap grid (last 35 days, 5 weeks)
  const heatmapGrid = useMemo(() => {
    const grid = [];
    const last35 = getLastNDaysCompletion(tasks || [], 35);
    for (let row = 0; row < 5; row++) {
      const week = last35.slice(row * 7, row * 7 + 7);
      grid.push(week);
    }
    return grid;
  }, [tasks]);

  // AI Insights
  const aiInsights = useMemo(() => {
    const insights: string[] = [];
    const { last7, last30 } = metrics;

    if (last30.length >= 7) {
      // Check for day-of-week patterns
      const dayStats: Record<number, number[]> = {};
      last30.forEach(day => {
        const date = new Date(day.dateISO);
        const dayOfWeek = date.getDay();
        if (!dayStats[dayOfWeek]) dayStats[dayOfWeek] = [];
        dayStats[dayOfWeek].push(day.completionPct);
      });

      const dayAverages: Record<number, number> = {};
      Object.keys(dayStats).forEach(day => {
        const stats = dayStats[parseInt(day)];
        dayAverages[parseInt(day)] = stats.reduce((a, b) => a + b, 0) / stats.length;
      });

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const lowestDay = Object.entries(dayAverages)
        .sort(([, a], [, b]) => a - b)[0];
      
      if (lowestDay && lowestDay[1] < 50) {
        insights.push(`${dayNames[parseInt(lowestDay[0])]}s are your least productive day (avg ${Math.round(lowestDay[1])}%)`);
      }

      // Check for trends
      if (last7.length >= 3) {
        const recent = last7.slice(-3).reduce((a, b) => a + b.completionPct, 0) / 3;
        const earlier = last7.slice(0, 3).reduce((a, b) => a + b.completionPct, 0) / 3;
        if (recent > earlier + 10) {
          insights.push("You're on an upward trend! Keep it up!");
        } else if (recent < earlier - 10) {
          insights.push("Your productivity has dipped recently. Try breaking tasks into smaller chunks.");
        }
      }
    }

    if (metrics.streak > 0) {
      insights.push(`🔥 ${metrics.streak}-day streak! Maintain your momentum.`);
    }

    if (metrics.completedTasks.length === 0) {
      insights.push("Complete your first task to start tracking analytics!");
    } else if (metrics.completedTasks.length < 5) {
      insights.push("Keep completing tasks to unlock more insights!");
    }

    return insights.length > 0 ? insights : ["Complete more tasks to see personalized insights!"];
  }, [metrics]);

  const isEstablished = metrics.last30.filter(d => d.completionPct > 0).length >= 7;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <div className="text-center text-green-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-8 space-y-6">
      {/* Header summary */}
      <div className="rounded-2xl border shadow-sm p-4 md:p-6 bg-white/5 dark:bg-black/30 backdrop-blur">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide text-green-400">
          Analytics
        </h1>
        <p className="mt-2 text-green-200">
          Today: <span className="font-semibold">{metrics.todayPct}%</span> · Streak:{" "}
          <span className="font-semibold">{metrics.streak}</span> days · Avg
          (7d): <span className="font-semibold">{metrics.avg7d}%</span>
        </p>
      </div>

      {/* Mode switch */}
      {!isEstablished ? (
        <OnboardingCards 
          data={metrics.last30} 
          tasksCompleted={metrics.completedTasks.length} 
        />
      ) : (
        <div className="space-y-6">
          {/* Completion Metrics */}
          <section className="rounded-2xl shadow-lg border border-green-500/30 p-4 md:p-6 bg-black/80 glass spotify-glow mb-4">
            <h2 className="matrix-font-large text-green-400 mb-2 drop-shadow-lg">
              Completion Metrics
            </h2>
            <p className="text-green-300 mb-4">
              Your daily, weekly, and monthly progress at a glance.
            </p>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <div className="text-3xl font-bold text-green-400 matrix-font-large drop-shadow-lg">
                  {metrics.todayPct}%
                </div>
                <div className="h-3 w-full bg-green-900/40 rounded-full overflow-hidden">
                  <div
                    className="h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all spotify-glow"
                    style={{ width: `${metrics.todayPct}%` }}
                  />
                </div>
                <div className="text-xs text-green-300 mt-1">
                  Today's completion rate
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <ResponsiveContainer width="100%" height={100}>
                  <ReLineChart
                    data={metrics.last7}
                    margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                  >
                    <XAxis 
                      dataKey="dateISO" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                      style={{ fontSize: '10px', fill: '#9CA3AF' }}
                    />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                      formatter={(v: any) => `${v}%`}
                      labelFormatter={(l: any) => new Date(l).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="completionPct"
                      stroke="#1DB954"
                      strokeWidth={2}
                      dot={{ fill: '#1DB954', r: 4 }}
                      connectNulls
                    />
                  </ReLineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-400 mt-1">Weekly trend</div>
              </div>
            </div>
            {/* Heatmap */}
            <div className="mt-6">
              <div className="font-semibold mb-2 text-green-400">
                Monthly Overview (Last 35 Days)
              </div>
              <div className="grid grid-cols-7 gap-1">
                {heatmapGrid.map((week, i) =>
                  week.map((d, j) => (
                    <div
                      key={`${i}-${j}-${d.dateISO}`}
                      className={`w-6 h-6 rounded ${heatColor(
                        d.completionPct
                      )} flex items-center justify-center text-xs font-mono cursor-pointer group border border-green-500/10`}
                      title={`${d.dateISO}: ${d.completionPct}%`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-green-400 matrix-font">
                        {d.completionPct}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Task Breakdown */}
          <section className="rounded-2xl shadow-lg border border-green-500/30 p-4 md:p-6 bg-black/80 glass spotify-glow mb-4">
            <h2 className="matrix-font-large text-green-400 mb-2 drop-shadow-lg">
              Task Breakdown
            </h2>
            <p className="text-green-300 mb-4">
              See how you complete tasks by priority and difficulty.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Priority Pie */}
              <div>
                <div className="font-semibold mb-2 text-green-300">
                  By Priority ({metrics.completedTasks.length} completed)
                </div>
                {metrics.completedTasks.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "High", value: metrics.priorities.High },
                          { name: "Medium", value: metrics.priorities.Medium },
                          { name: "Low", value: metrics.priorities.Low },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        <Cell key="High" fill="#EF4444" />
                        <Cell key="Medium" fill="#F59E0B" />
                        <Cell key="Low" fill="#1DB954" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-green-700/70 h-[200px] flex items-center justify-center">
                    No completed tasks yet
                  </div>
                )}
              </div>
              {/* Difficulty Bar */}
              <div>
                <div className="font-semibold mb-2 text-green-300">
                  By Difficulty
                </div>
                {metrics.completedTasks.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={[
                        { name: "Easy", value: metrics.difficulties.Easy },
                        { name: "Moderate", value: metrics.difficulties.Moderate },
                        { name: "Hard", value: metrics.difficulties.Hard },
                      ]}
                    >
                      <XAxis dataKey="name" style={{ fontSize: '12px', fill: '#9CA3AF' }} />
                      <YAxis style={{ fontSize: '12px', fill: '#9CA3AF' }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-green-700/70 h-[200px] flex items-center justify-center">
                    No completed tasks yet
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Time & Streak Tracking */}
          <section className="rounded-2xl shadow-lg border border-green-500/30 p-4 md:p-6 bg-black/80 glass spotify-glow mb-4">
            <h2 className="matrix-font-large text-green-400 mb-2 drop-shadow-lg">
              Time & Streak
            </h2>
            <p className="text-green-300 mb-4">
              Track your streaks and productivity patterns.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="font-semibold mb-2 text-green-300">
                  Active Streak
                </div>
                <div className="text-3xl font-bold text-green-400 matrix-font-large drop-shadow-lg">
                  {metrics.streak} {metrics.streak === 1 ? 'day' : 'days'}
                </div>
                <div className="text-xs text-green-300 mt-1">
                  {metrics.streak > 0 ? 'Keep it up! 🔥' : 'Start completing tasks to build your streak!'}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-2 text-green-300">
                  Peak Productivity Hours
                </div>
                {metrics.hours.some((h) => h > 0) ? (
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart
                      data={metrics.hours.map((v, i) => ({ hour: i, count: v }))}
                    >
                      <XAxis 
                        dataKey="hour" 
                        style={{ fontSize: '10px', fill: '#9CA3AF' }}
                        interval={2}
                      />
                      <YAxis style={{ fontSize: '10px', fill: '#9CA3AF' }} />
                      <Tooltip 
                        formatter={(value: any) => `${value} tasks`}
                        labelFormatter={(label: any) => `${label}:00`}
                      />
                      <Bar dataKey="count" fill="#1DB954" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-green-700/70 h-[120px] flex items-center justify-center">
                    No productivity hour data yet
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* AI Insights */}
          <section className="rounded-2xl shadow-lg border border-green-500/30 p-4 md:p-6 bg-black/80 glass spotify-glow mb-4">
            <h2 className="matrix-font-large text-green-400 mb-2 drop-shadow-lg">
              AI Insights
            </h2>
            <p className="text-green-300 mb-4">
              Personalized insights based on your activity.
            </p>
            <div className="space-y-3">
              {aiInsights.map((insight, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-3 border border-green-500/20">
                  <p className="text-green-200 text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Always-on Motivation */}
      <MotivationCard />
    </div>
  );
}
