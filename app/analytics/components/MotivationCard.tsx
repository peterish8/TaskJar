"use client";
import React from "react";

const tips = [
  "Consistency beats intensity — 1 small win today is enough.",
  "Batch similar tasks to stay in flow.",
  "Protect your peak hour — do the hardest task first.",
  "Reduce scope, not goals. Ship something small.",
  "Your streak is your superpower. Keep it alive.",
];

export default function MotivationCard() {
  const tip = tips[Math.floor(Math.random() * tips.length)];
  return (
    <div className="rounded-2xl border shadow-sm p-4 md:p-6 bg-white/5 dark:bg-black/30 backdrop-blur">
      <h3 className="text-lg font-semibold tracking-wide text-green-400">
        Motivation
      </h3>
      <p className="mt-2 text-sm md:text-base text-green-100">{tip}</p>
    </div>
  );
}
