import type { PlanName } from "@/db/queries/plans";
import type { GrowthTrendPoint, SocietySort } from "@/db/queries/societies";
import type { GetSocietyListInput } from "@/trpc/schema";

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
   Growth trend series
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Series keys of the cumulative growth chart, in the query's rank order (top
 * areas first, "Other" last). The chart and its legend both drive off this so
 * colours stay assigned to the same area everywhere.
 */
export function growthSeriesKeys(points: GrowthTrendPoint[]): string[] {
  const first = points[0];
  if (!first) return [];
  return Object.keys(first).filter((key) => key !== "month");
}

/* ────────────────────────────────────────────────────────────────────────────
   Society table state ⇄ tRPC input
   ──────────────────────────────────────────────────────────────────────────── */

export const SOCIETY_TABLE_PAGE_SIZE = 25;

export type SocietyTableState = {
  page: number;
  sort: SocietySort;
  dir: "asc" | "desc";
  areaId?: number;
  search?: string;
};

export const DEFAULT_SOCIETY_TABLE_STATE: SocietyTableState = {
  page: 1,
  sort: "penetration",
  dir: "desc",
};

/**
 * Maps UI state to the tRPC input. Unset filters are omitted entirely so the
 * server prefetch key and the first client render key are byte-identical.
 */
export function toSocietyTableInput(state: SocietyTableState): GetSocietyListInput {
  return {
    page: state.page,
    limit: SOCIETY_TABLE_PAGE_SIZE,
    sort: state.sort,
    dir: state.dir,
    ...(state.areaId ? { areaId: state.areaId } : {}),
    ...(state.search ? { search: state.search } : {}),
  };
}
