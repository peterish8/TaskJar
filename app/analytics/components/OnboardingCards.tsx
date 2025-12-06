"use client";
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { DailyCompletion } from "../../lib/analytics";

export default function OnboardingCards({
  data,
  tasksCompleted,
}: {
  data: DailyCompletion[];
  tasksCompleted: number;
}) {
  const last = data.slice(-7);
  const target = 10; // first milestone
  const pct = Math.min(100, Math.round((tasksCompleted / target) * 100));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-2xl border shadow-sm p-4 md:p-6 bg-white/5 dark:bg-black/30 backdrop-blur">
        <h2 className="text-xl md:text-2xl font-bold text-green-400">
          Welcome to your first week! 🎉
        </h2>
        <p className="mt-2 text-green-100">
          Your journey just started — every task counts towards building your
          streak.
        </p>
      </div>

      {/* Early progress snapshot */}
      <div className="rounded-2xl border shadow-sm p-4 md:p-6 bg-white/5 dark:bg-black/30 backdrop-blur">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-green-300">Tasks completed so far</p>
            <div className="text-3xl md:text-4xl font-extrabold text-green-400">
              {tasksCompleted}
            </div>
          </div>
          <div className="text-sm text-green-300">
            {pct}% of first milestone (10)
          </div>
        </div>
        <div className="mt-3 h-3 w-full rounded-full bg-green-900/30">
          <div
            className="h-3 rounded-full bg-green-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Mini completion chart */}
      <div className="rounded-2xl border shadow-sm p-4 md:p-6 bg-white/5 dark:bg-black/30 backdrop-blur">
        <h3 className="text-lg font-semibold text-green-400 mb-3">This week</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last.map((r) => ({
                date: r.dateISO.slice(5),
                pct: r.completionPct,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} hide />
              <Tooltip />
              <Bar dataKey="pct" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-sm text-green-200">
          Fill the blanks — even 1 task/day builds your streak.
        </p>
      </div>

      {/* First AI tip placeholder */}
      <div className="rounded-2xl border shadow-sm p-4 md:p-6 bg-white/5 dark:bg-black/30 backdrop-blur">
        <h3 className="text-lg font-semibold text-green-400">Quick Tip</h3>
        <p className="mt-2 text-green-100">
          Complete one small task before noon. Early wins boost the rest of your
          day.
        </p>
      </div>
    </div>
  );
}
