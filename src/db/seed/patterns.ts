import type { Faker } from "@faker-js/faker";

/**
 * Shared deterministic helpers for the seed pipeline.
 *
 * Every function is pure - randomness is injected through a `Faker` instance so
 * re-running the seed with a different faker seed produces a different (but
 * internally consistent) dataset.
 */

export const MONTHS_OF_HISTORY = 24;

/* ---------------------------------------------------------
   Dates
   --------------------------------------------------------- */

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

export function addHours(date: Date, hours: number): Date {
  const copy = new Date(date);
  copy.setHours(copy.getHours() + hours);
  return copy;
}

export function startOfMonth(date: Date): Date {
  const copy = new Date(date);
  copy.setDate(1);
  return startOfDay(copy);
}

export function endOfMonth(date: Date): Date {
  return addDays(startOfMonth(addMonths(date, 1)), -1);
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

/** `date` columns that represent a billing month use the first day of the month. */
export function monthKey(date: Date): string {
  return toDateKey(startOfMonth(date));
}

/** First day of the 24-month history window. */
export function historyWindowStart(today: Date): Date {
  return startOfMonth(addMonths(today, -(MONTHS_OF_HISTORY - 1)));
}

export function randomTimeOnDay(faker: Faker, date: Date, minHour = 6, maxHour = 21): Date {
  const at = new Date(date);
  const hour = randInt(faker, minHour, maxHour);
  const minute = randInt(faker, 0, 59);
  at.setHours(hour, minute, randInt(faker, 0, 59), 0);
  return at;
}

/* ---------------------------------------------------------
   Randomness
   --------------------------------------------------------- */

export function randInt(faker: Faker, min: number, max: number): number {
  return faker.number.int({ min, max });
}

export function randFloat(faker: Faker, min: number, max: number, fractionDigits = 1): number {
  return Number(faker.number.float({ min, max, fractionDigits }).toFixed(fractionDigits));
}

export function chance(faker: Faker, probability: number): boolean {
  return faker.number.float({ min: 0, max: 1 }) < probability;
}

/** Weighted pick: entries are `[value, weight]` pairs. */
export function pickWeighted<T>(faker: Faker, entries: readonly (readonly [T, number])[]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = faker.number.float({ min: 0, max: total });
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Knuth sampling for small lambdas - keeps pattern distributions honest. */
export function poisson(faker: Faker, lambda: number): number {
  const limit = Math.exp(-lambda);
  let product = faker.number.float({ min: 0, max: 1 }) || 1;
  let count = 0;
  while (product > limit && count < 20) {
    count += 1;
    product *= faker.number.float({ min: 0, max: 1, fractionDigits: 6 });
  }
  return count;
}

/**
 * Distribute `total` items across buckets by weight, always allocating exactly
 * `total` (largest-remainder method) - used for onboarding waves.
 */
export function allocateExactly(total: number, weights: readonly number[]): number[] {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const exact = weights.map((weight) => (weight / weightSum) * total);
  const counts = exact.map(Math.floor);
  let remaining = total - counts.reduce((sum, count) => sum + count, 0);
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const { index } of order) {
    if (remaining === 0) break;
    counts[index] += 1;
    remaining -= 1;
  }
  return counts;
}

/* ---------------------------------------------------------
   Seasonality (Bangalore)
   --------------------------------------------------------- */

const MONSOON_MONTHS = new Set([5, 6, 7, 8, 9]); // Jun – Oct
const SUMMER_MONTHS = new Set([2, 3, 4]); // Mar – May

/**
 * Multiplier applied to the TDS/purity drift *speed*:
 * monsoon water carries more sediment (filters clog faster), summer means
 * heavier usage (more litres through the membrane).
 */
export function seasonalityMultiplier(date: Date): number {
  const month = date.getMonth();
  if (MONSOON_MONTHS.has(month)) return 1.25;
  if (SUMMER_MONTHS.has(month)) return 1.12;
  return 1;
}

/** Extra hardness load during the monsoon (muddy source water). */
export function monsoonHardnessBoost(date: Date): number {
  return MONSOON_MONTHS.has(date.getMonth()) ? 1.12 : 1;
}

/* ---------------------------------------------------------
   Filter degradation - the causal core
   --------------------------------------------------------- */

export const TDS_REPAIR_THRESHOLD = 500;
export const PURITY_REPAIR_THRESHOLD = 85;
export const FILTER_CHANGE_MIN_DAYS = 60;
export const FILTER_CHANGE_MAX_DAYS = 75;

/** Older area infrastructure → siltier input water → faster membrane exhaustion. */
export function infraDriftFactor(infrastructureAgeYears: number): number {
  return 1 + Math.max(0, infrastructureAgeYears - 4) * 0.035;
}

/**
 * TDS (ppm) after `progress` of a filter cycle. Shaped slightly convex so the
 * last weeks visibly accelerate; `progress` may pass 1 when a repair takes
 * longer than the natural cycle (the curve is capped near 1.08).
 */
export function projectTds(progress: number, baseline: number, ceiling: number): number {
  return baseline + (ceiling - baseline) * Math.pow(clamp(progress, 0, 1.08), 1.12);
}

/** Purity tracks TDS: ~97.5% on a fresh filter, ~84% at the hard ceiling. */
export function derivePurity(tdsPpm: number): number {
  return round1(clamp(97.5 - (tdsPpm - 110) * 0.0305, 82, 98.5));
}

/** Hardness (mg/L) drifts with the same progress ratio + monsoon boost. */
export function deriveHardness(
  baselineHardness: number,
  ceilingHardness: number,
  progress: number,
  date: Date
): number {
  const value = baselineHardness + (ceilingHardness - baselineHardness) * Math.pow(clamp(progress, 0, 1), 1.1);
  return Math.round(value * monsoonHardnessBoost(date));
}
