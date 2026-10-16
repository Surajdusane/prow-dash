import type { PlanName } from "@/db/queries/plans";
import { categoryColorPair, categorySwatch } from "@/lib/chart-colors";

/* ────────────────────────────────────────────────────────────────────────────
   Labels
   ──────────────────────────────────────────────────────────────────────────── */

export const PLAN_LABELS: Record<PlanName, string> = {
  starter: "Starter",
  standard: "Standard",
  premium: "Premium",
};

/** Fixed order so plan breakdowns always read the same way. */
export const PLAN_ORDER: PlanName[] = ["starter", "standard", "premium"];

/* ────────────────────────────────────────────────────────────────────────────
   Series colours — water is sky, jars are emerald, plans reuse the shared set
   ──────────────────────────────────────────────────────────────────────────── */

export const LITRES_COLOR_PAIR = categoryColorPair(0);
export const LITRES_SWATCH = categorySwatch(0);
export const JARS_COLOR_PAIR = categoryColorPair(2);
export const JARS_SWATCH = categorySwatch(2);
