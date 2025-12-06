"use client";
import React from "react";
import {
  loadDailyCompletion,
  last7,
  streakCount,
  averagePct,
  hasAtLeastNDays,
} from "../lib/analytics";
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
} from "recharts";

function heatColor(pct: number): string {
  if (pct === 0) return "bg-gray-200 dark:bg-neutral-800";
  if (pct < 34) return "bg-yellow-200 dark:bg-yellow-700/50";
  if (pct < 67) return "bg-yellow-400 dark:bg-yellow-600";
  return "bg-green-500 dark:bg-green-600";
}

function getStreak(days: any[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].completionPct > 0) streak++;
    else break;
  }
  return streak;
}

function getWeeklySegments(last7: any[]) {
  const up: (any & { delta: number })[] = [];
  const down: (any & { delta: number })[] = [];
  const flat: (any & { delta: number })[] = [];
  for (let i = 1; i < last7.length; i++) {
    const delta = last7[i].completionPct - last7[i - 1].completionPct;
    const point = { ...last7[i], delta };
    if (delta > 0) up.push(point);
    else if (delta < 0) down.push(point);
    else flat.push(point);
  }
  return { up, down, flat };
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

export default function AnalyticsPage() {
  const rows = loadDailyCompletion();
  const isEstablished = hasAtLeastNDays(rows, 7);
  const week = last7(rows);
  const todayPct = week.length ? week[week.length - 1].completionPct : 0;
  const tasksCompletedSoFar = Math.round(
    week.reduce((acc, r) => acc + (r.completionPct > 0 ? 1 : 0), 0) * 1.5
  );

  // Completion data
  const daily = loadDailyCompletion();
  const today = daily[daily.length - 1] || { completionPct: 0, dateISO: "" };
  const last7 = daily.slice(-7);
  const last30 = daily;
  const streak = getStreak(last30);
  const forecast = Math.round(
    last7.reduce((a, b) => a + b.completionPct, 0) / (last7.length || 1)
  );

  // Task data
  const completedTasks = load<any[]>("taskjar.completedTasks", []);
  const priorities = { High: 0, Medium: 0, Low: 0 };
  const categories: Record<string, number> = {};
  const difficulties = { Easy: 0, Moderate: 0, Hard: 0 };
  let hours: number[] = Array(24).fill(0);
  let totalTasks = 0;
  let totalTime = 0;
  let timeCount = 0;

  completedTasks.forEach((t) => {
    priorities[
      t.priority === "urgent"
        ? "High"
        : t.priority === "scheduled"
        ? "Medium"
        : "Low"
    ]++;
    if (t.label) categories[t.label] = (categories[t.label] || 0) + 1;
    difficulties[
      t.difficulty === "challenging"
        ? "Hard"
        : t.difficulty === "standard"
        ? "Moderate"
        : "Easy"
    ]++;
    if (t.completedAt && t.createdAt) {
      const diff = t.completedAt - t.createdAt;
      if (diff > 0) {
        totalTime += diff;
        timeCount++;
      }
      const hour = new Date(t.completedAt).getHours();
      hours[hour]++;
    }
    totalTasks++;
  });

  // Weekly trend segments
  const weeklySegments = getWeeklySegments(last7);

  // Heatmap grid (7x5)
  const heatmapGrid = [];
  for (let row = 0; row < 5; row++) {
    const week = last30.slice(row * 7, row * 7 + 7);
    heatmapGrid.push(week);
  }

  // AI Insights (simple)
  const aiInsights: string[] = [];
  if (last30.length >= 7) {
    const mondayAvg =
      last30
        .filter((d, i) => new Date(d.dateISO).getDay() === 1)
        .reduce((a, b) => a + b.completionPct, 0) /
      (last30.filter((d, i) => new Date(d.dateISO).getDay() === 1).length || 1);
    if (mondayAvg < 50) aiInsights.push("Mondays trend lower");
    const midweek =
      last30.slice(2, 5).reduce((a, b) => a + b.completionPct, 0) / 3;
    if (midweek < 50) aiInsights.push("Mid-week productivity drops");
    if (!aiInsights.length)
      aiInsights.push("No strong missed task patterns detected");
  } else {
    aiInsights.push("Insufficient data");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-8 space-y-6">
      {/* Header summary */}
      <div className="rounded-2xl border shadow-sm p-4 md:p-6 bg-white/5 dark:bg-black/30 backdrop-blur">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide text-green-400">
          Analytics
        </h1>
        <p className="mt-2 text-green-200">
          Today: <span className="font-semibold">{todayPct}%</span> · Streak:{" "}
          <span className="font-semibold">{streakCount(rows)}</span> days · Avg
          (7d): <span className="font-semibold">{averagePct(week)}%</span>
        </p>
      </div>

      {/* Mode switch */}
      {!isEstablished ? (
        <OnboardingCards data={rows} tasksCompleted={tasksCompletedSoFar} />
      ) : (
        <div className="space-y-6">
          {/* === Full analytics UI (existing sections) === */}
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
                  {today.completionPct}%
                </div>
                <div className="h-3 w-full bg-green-900/40 rounded-full overflow-hidden">
                  <div
                    className="h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all spotify-glow"
                    style={{ width: `${today.completionPct}%` }}
                  />
                </div>
                <div className="text-xs text-green-300 mt-1">
                  Today's completion rate
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <ResponsiveContainer width="100%" height={100}>
                  <ReLineChart
                    data={last7}
                    margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                  >
                    <XAxis dataKey="dateISO" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                      formatter={(v: any) => `${v}%`}
                      labelFormatter={(l: any) => l}
                    />
                    <Line
                      type="monotone"
                      dataKey="completionPct"
                      stroke="#1DB954"
                      strokeWidth={2}
                      dot={false}
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
                Monthly Overview
              </div>
              <div className="grid grid-cols-7 gap-1">
                {heatmapGrid.map((week, i) =>
                  week.map((d, j) => (
                    <div
                      key={d.dateISO}
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
              See how you complete tasks by priority, category, and difficulty.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Priority Pie */}
              <div>
                <div className="font-semibold mb-2 text-green-300">
                  By Priority
                </div>
                {priorities.High + priorities.Medium + priorities.Low > 0 ? (
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "High", value: priorities.High },
                          { name: "Medium", value: priorities.Medium },
                          { name: "Low", value: priorities.Low },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={40}
                        label
                      >
                        <Cell key="High" fill="#EF4444" />
                        <Cell key="Medium" fill="#F59E0B" />
                        <Cell key="Low" fill="#1DB954" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-green-700/70">
                    No priority data
                  </div>
                )}
              </div>
              {/* Category Bar */}
              <div>
                <div className="font-semibold mb-2 text-green-300">
                  By Category
                </div>
                {Object.keys(categories).length > 0 ? (
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart
                      data={Object.entries(categories).map(([k, v]) => ({
                        name: k,
                        value: v,
                      }))}
                    >
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Bar dataKey="value" fill="#6366F1" />
                      <Tooltip />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-green-700/70">
                    No category data
                  </div>
                )}
              </div>
              {/* Difficulty Bar */}
              <div>
                <div className="font-semibold mb-2 text-green-300">
                  Avg. Difficulty Completed
                </div>
                {difficulties.Easy + difficulties.Moderate + difficulties.Hard >
                0 ? (
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart
                      data={[
                        { name: "Easy", value: difficulties.Easy },
                        { name: "Moderate", value: difficulties.Moderate },
                        { name: "Hard", value: difficulties.Hard },
                      ]}
                    >
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Bar dataKey="value" fill="#10B981" />
                      <Tooltip />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-green-700/70">
                    No difficulty data
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
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="font-semibold mb-2 text-green-300">
                  Active Streak
                </div>
                <div className="text-3xl font-bold text-green-400 matrix-font-large drop-shadow-lg">
                  {streak} days
                </div>
              </div>
              <div>
                <div className="font-semibold mb-2 text-green-300">
                  Avg. Time to Complete
                </div>
                {timeCount > 0 ? (
                  <div className="text-lg text-green-400 matrix-font drop-shadow-lg">
                    {Math.round(totalTime / timeCount / 60000)} min
                  </div>
                ) : (
                  <div className="text-xs text-green-700/70">
                    Not enough data yet
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold mb-2 text-green-300">
                  Peak Productivity Hours
                </div>
                {hours.some((h) => h > 0) ? (
                  <ResponsiveContainer width="100%" height={60}>
                    <BarChart
                      data={hours.map((v, i) => ({ name: i, value: v }))}
                    >
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Bar dataKey="value" fill="#1DB954" />
                      <Tooltip />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-green-700/70">
                    No productivity hour data
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
              Simple predictions and patterns based on your recent activity.
            </p>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="font-semibold mb-2 text-green-300">
                  Predicted Productivity (next 7d)
                </div>
                <div className="text-3xl font-bold text-green-400 matrix-font-large drop-shadow-lg">
                  {forecast}%
                </div>
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-2 text-green-300">
                  Missed Task Patterns
                </div>
                <ul className="list-disc pl-5 text-sm text-green-200">
                  {aiInsights.map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Always-on Motivation */}
      <MotivationCard />
    </div>
  );
}
