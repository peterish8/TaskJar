/**
 * Storage utility functions for Weekly Dump feature
 */

/**
 * Load data from localStorage with fallback
 */
export function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Remove data from localStorage
 */
export function remove(key: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
  }
}

/**
 * Storage keys for Weekly Dump
 */
export const STORAGE_KEYS = {
  SELECTED_START_DATE: "taskjar.selectedStartDate",
  ARCHIVED_WEEKS: "taskjar.archivedWeeks",
  WEEKLY_DUMP_TASKS: "taskjar.weeklyDumpTasks",
  PROFILE_INITIALS: "taskjar.profile.initials",
  PROFILE_BG_COLOR: "taskjar.profile.bgColor",
  ANALYTICS_DAILY_COMPLETION: "taskjar.analytics.dailyCompletion",
} as const;
