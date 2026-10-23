/**
 * Small pure date/number helpers shared by the query modules.
 *
 * App queries must never import from `src/db/seed` - these helpers keep the two
 * worlds apart while sharing the same calendar conventions.
 */

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function startOfMonth(date: Date): Date {
  const copy = new Date(date);
  copy.setDate(1);
  return startOfDay(copy);
}

export function endOfMonth(date: Date): Date {
  return startOfDay(addDays(startOfMonth(addMonths(date, 1)), -1));
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/** `date` columns expect `YYYY-MM-DD` strings. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** `YYYY-MM` label used by every monthly chart series. */
export function toMonthKey(date: Date): string {
  return toDateKey(date).slice(0, 7);
}

export type MonthWindow = {
  /** `YYYY-MM` - safe to use directly as a chart x-axis value. */
  key: string;
  start: Date;
  end: Date;
};

/** The last `count` calendar months (oldest first), ending with the current one. */
export function lastMonths(count: number, now: Date = new Date()): MonthWindow[] {
  const windows: MonthWindow[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const month = addMonths(startOfMonth(now), -index);
    windows.push({ key: toMonthKey(month), start: month, end: endOfMonth(month) });
  }
  return windows;
}

export function roundTo(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Percentage with a zero-safe denominator. */
export function toPercent(numerator: number, denominator: number, digits = 1): number {
  if (!denominator) return 0;
  return roundTo((numerator / denominator) * 100, digits);
}

/** Postgres `numeric`/`decimal` columns arrive as strings - normalise to numbers. */
export function asNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
