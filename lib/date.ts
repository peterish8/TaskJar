/**
 * Date utility functions for Weekly Dump feature
 */

/**
 * Convert a Date to ISO date string (YYYY-MM-DD)
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convert ISO date string to Date object (local timezone)
 */
export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Get the start of day in local timezone
 */
export function startOfDayLocal(date: Date): Date {
  const local = new Date(date);
  local.setHours(0, 0, 0, 0);
  return local;
}

/**
 * Get a 7-day window starting from the given start date
 * Returns array of 7 ISO date strings
 */
export function getWeekWindow(startISO: string): string[] {
  const startDate = fromISODate(startISO);
  const dates: string[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(toISODate(date));
  }

  return dates;
}

/**
 * Get today's date as ISO string
 */
export function getTodayISO(): string {
  const today = new Date();
  return toISODate(today);
}

/**
 * Format date for display (e.g., "Mon, 05 Aug")
 */
export function formatDateForDisplay(isoDate: string): string {
  const date = fromISODate(isoDate);
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${dayName}, ${day} ${month}`;
}

/**
 * Format week range for display (e.g., "Wed, 06 Aug 2025 – Tue, 12 Aug 2025")
 */
export function formatWeekRange(startISO: string): string {
  const dates = getWeekWindow(startISO);
  const startDate = fromISODate(dates[0]);
  const endDate = fromISODate(dates[6]);

  const startFormatted = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const endFormatted = endDate.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `${startFormatted} – ${endFormatted}`;
}

/**
 * Check if a date is today
 */
export function isToday(isoDate: string): boolean {
  return isoDate === getTodayISO();
}

/**
 * Check if a date is in the past
 */
export function isPastDate(isoDate: string): boolean {
  const today = getTodayISO();
  return isoDate < today;
}

/**
 * Debug function to log week window calculation
 */
export function debugWeekWindow(startISO: string): void {
  console.log("Debug Week Window:");
  console.log("Start ISO:", startISO);
  const startDate = fromISODate(startISO);
  console.log("Start Date:", startDate);
  console.log("Start Date Day:", startDate.getDay());
  console.log("Start Date Date:", startDate.getDate());

  const weekWindow = getWeekWindow(startISO);
  console.log("Week Window:", weekWindow);

  weekWindow.forEach((date, index) => {
    const d = fromISODate(date);
    console.log(
      `Day ${index}: ${date} (${d.toLocaleDateString("en-US", {
        weekday: "long",
      })})`
    );
  });
}
