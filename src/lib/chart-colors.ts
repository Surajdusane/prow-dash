import type { PlanName } from "@/db/queries/plans";

/**
 * Shared chart palette — the single source of truth for series hues that cross
 * route boundaries (plan colours appear on Overview, Revenue and
 * Sustainability; payment statuses on Revenue and Customer drawers). Pick from
 * here instead of inlining hexes per feature so the same entity keeps the same
 * colour everywhere.
 *
 * Each entry carries a light + dark hex because the evilcharts configs emit CSS
 * variables per theme, and a Tailwind `swatch` class pair for hand-rolled
 * legends. `*_HEX` literals are for canvas overrides (`chartOptions`), which
 * cannot resolve CSS variables.
 */

export type ColorPair = { light: string; dark: string };

/** Shape an evilcharts `ChartConfig` color entry needs: one theme-aware slot. */
export function chartColor(pair: ColorPair): { light: string[]; dark: string[] } {
  return { light: [pair.light], dark: [pair.dark] };
}

/* ────────────────────────────────────────────────────────────────────────────
   Plans — amber / sky / violet, reused across routes
   ──────────────────────────────────────────────────────────────────────────── */

export const PLAN_COLOR_PAIRS: Record<PlanName, ColorPair> = {
  starter: { light: "#d97706", dark: "#fbbf24" },
  standard: { light: "#0284c7", dark: "#38bdf8" },
  premium: { light: "#7c3aed", dark: "#a78bfa" },
};

export const PLAN_SWATCHES: Record<PlanName, string> = {
  starter: "bg-[#d97706] dark:bg-[#fbbf24]",
  standard: "bg-[#0284c7] dark:bg-[#38bdf8]",
  premium: "bg-[#7c3aed] dark:bg-[#a78bfa]",
};

/* ────────────────────────────────────────────────────────────────────────────
   Payment status — semantic (paid good, late warn, failed bad, pending muted)
   ──────────────────────────────────────────────────────────────────────────── */

export type PaymentStatusKey = "paid" | "late" | "failed" | "pending";

export const PAYMENT_STATUS_COLOR_PAIRS: Record<PaymentStatusKey, ColorPair> = {
  paid: { light: "#059669", dark: "#34d399" },
  late: { light: "#d97706", dark: "#fbbf24" },
  failed: { light: "#e11d48", dark: "#fb7185" },
  pending: { light: "#94a3b8", dark: "#64748b" },
};

export const PAYMENT_STATUS_SWATCHES: Record<PaymentStatusKey, string> = {
  paid: "bg-[#059669] dark:bg-[#34d399]",
  late: "bg-[#d97706] dark:bg-[#fbbf24]",
  failed: "bg-[#e11d48] dark:bg-[#fb7185]",
  pending: "bg-[#94a3b8] dark:bg-[#64748b]",
};

/* ────────────────────────────────────────────────────────────────────────────
   Dynamic category series — top areas (stacked growth) and similar
   ──────────────────────────────────────────────────────────────────────────── */

/** Ordered hues for series keyed off data (areas, categories). Last slot is the muted "Other". */
export const CATEGORY_COLOR_PAIRS: ColorPair[] = [
  { light: "#0284c7", dark: "#38bdf8" }, // sky
  { light: "#7c3aed", dark: "#a78bfa" }, // violet
  { light: "#059669", dark: "#34d399" }, // emerald
  { light: "#d97706", dark: "#fbbf24" }, // amber
  { light: "#e11d48", dark: "#fb7185" }, // rose
  { light: "#0d9488", dark: "#2dd4bf" }, // teal
  { light: "#4f46e5", dark: "#818cf8" }, // indigo
  { light: "#ca8a04", dark: "#facc15" }, // yellow
  { light: "#64748b", dark: "#94a3b8" }, // slate — "Other"
];

/** Tailwind swatch class pair for hand-rolled legends, matching CATEGORY_COLOR_PAIRS. */
export const CATEGORY_SWATCHES: string[] = [
  "bg-[#0284c7] dark:bg-[#38bdf8]",
  "bg-[#7c3aed] dark:bg-[#a78bfa]",
  "bg-[#059669] dark:bg-[#34d399]",
  "bg-[#d97706] dark:bg-[#fbbf24]",
  "bg-[#e11d48] dark:bg-[#fb7185]",
  "bg-[#0d9488] dark:bg-[#2dd4bf]",
  "bg-[#4f46e5] dark:bg-[#818cf8]",
  "bg-[#ca8a04] dark:bg-[#facc15]",
  "bg-[#64748b] dark:bg-[#94a3b8]",
];

/** Palette entry for the n-th dynamic series, wrapping if there are more series than hues. */
export function categoryColorPair(index: number): ColorPair {
  return CATEGORY_COLOR_PAIRS[index % CATEGORY_COLOR_PAIRS.length];
}

/** Swatch class for the n-th dynamic series, wrapping like `categoryColorPair`. */
export function categorySwatch(index: number): string {
  return CATEGORY_SWATCHES[index % CATEGORY_SWATCHES.length];
}

/** The muted slate used for the folded-in "Other" bucket — always the last slot. */
export const OTHER_COLOR_PAIR: ColorPair = CATEGORY_COLOR_PAIRS[CATEGORY_COLOR_PAIRS.length - 1];
export const OTHER_SWATCH: string = CATEGORY_SWATCHES[CATEGORY_SWATCHES.length - 1];
