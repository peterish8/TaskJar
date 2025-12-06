"use client";
import { useEffect } from "react";
import {
  loadDailyCompletion,
  saveDailyCompletion,
  todayISO,
} from "../lib/analytics";

export function useCompletionUpdater(currentPctToday: number | null) {
  useEffect(() => {
    if (currentPctToday == null) return;
    const rows = loadDailyCompletion();
    const t = todayISO();
    const updated = rows.map((r) =>
      r.dateISO === t ? { ...r, completionPct: currentPctToday } : r
    );
    saveDailyCompletion(updated);
  }, [currentPctToday]);
}




