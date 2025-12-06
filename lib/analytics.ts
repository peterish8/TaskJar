/**
 * Analytics utility functions for daily completion tracking
 */

export type DailyCompletion = { dateISO: string; completionPct: number }; // 0–100
export function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
export function lastNDaysISO(n: number): string[] {
  const out: string[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
export function normalizeLast30Days(
  rows: DailyCompletion[]
): DailyCompletion[] {
  const days = lastNDaysISO(30);
  const map = new Map(rows.map((r) => [r.dateISO, r.completionPct]));
  return days.map((dateISO) => ({
    dateISO,
    completionPct: Math.max(0, Math.min(100, map.get(dateISO) ?? 0)),
  }));
}
export function loadDailyCompletion(): DailyCompletion[] {
  const raw =
    typeof window === "undefined"
      ? []
      : JSON.parse(
          localStorage.getItem("taskjar.analytics.dailyCompletion") || "[]"
        );
  return normalizeLast30Days(Array.isArray(raw) ? raw : []);
}
export function saveDailyCompletion(rows: DailyCompletion[]) {
  localStorage.setItem(
    "taskjar.analytics.dailyCompletion",
    JSON.stringify(normalizeLast30Days(rows))
  );
}

/**
 * Get today's completion percentage
 */
export function getTodayCompletion(): number {
  const today = new Date().toISOString().split("T")[0];
  const rows = loadDailyCompletion();
  const todayRow = rows.find((row) => row.dateISO === today);
  return todayRow ? todayRow.completionPct : 0;
}

/**
 * Update today's completion percentage
 */
export function updateTodayCompletion(completionPct: number): void {
  const rows = loadDailyCompletion();
  const normalized = normalizeLast30Days(rows);
  const today = new Date().toISOString().split("T")[0];

  // Update today's completion
  const updated = normalized.map((row) =>
    row.dateISO === today ? { ...row, completionPct } : row
  );

  saveDailyCompletion(updated);
}

export function streakCount(rows: DailyCompletion[]): number {
  let c = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    if ((rows[i]?.completionPct ?? 0) > 0) c++;
    else break;
  }
  return c;
}
export function averagePct(rows: DailyCompletion[]): number {
  if (!rows.length) return 0;
  const sum = rows.reduce((s, r) => s + (r.completionPct || 0), 0);
  return Math.round(sum / rows.length);
}
export function last7(rows: DailyCompletion[]) {
  return rows.slice(-7);
}
export function hasAtLeastNDays(rows: DailyCompletion[], n: number): boolean {
  const slice = rows.slice(-n);
  return slice.length >= n || slice.some((r) => (r.completionPct || 0) > 0);
}

