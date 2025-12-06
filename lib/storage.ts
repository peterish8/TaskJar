/**
 * Storage utility functions for Weekly Dump feature
 */

/**
 * Load data from localStorage with fallback
 */
export function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return fallback;
  }
}

/**
 * Save data to localStorage
 */
export function save<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
}

/**
 * Remove data from localStorage
 */
export function remove(key: string): void {
  if (typeof window === 'undefined') return;
  
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
  SELECTED_START_DATE: 'taskjar.selectedStartDate',
  ARCHIVED_WEEKS: 'taskjar.archivedWeeks',
  WEEKLY_DUMP_TASKS: 'taskjar.weeklyDumpTasks',
} as const; 