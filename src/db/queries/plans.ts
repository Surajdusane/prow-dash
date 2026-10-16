/**
 * Shared plan reference for the analytics queries — mirrors the documented
 * assumptions in the master plan (§6). Plan pricing itself lives in the DB;
 * litres-per-day is a documented estimate used by /sustainability.
 */

export type PlanName = "starter" | "standard" | "premium";

/** Litres produced per active subscription-day. */
export const PLAN_LITRES_PER_DAY: Record<PlanName, number> = {
  starter: 8,
  standard: 12,
  premium: 18,
};

/** 1 jar = 20L (sustainability estimates). */
export const JAR_SIZE_LITRES = 20;
