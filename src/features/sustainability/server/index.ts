import { batchPrefetch, prefetch, trpc } from "@/trpc/server";

export const prefetchImpactTotals = () => prefetch(trpc.impact.getTotals.queryOptions());

export const prefetchImpactMonthlyTrend = () => prefetch(trpc.impact.getMonthlyTrend.queryOptions());

export const prefetchImpactByPlan = () => prefetch(trpc.impact.getByPlan.queryOptions());

/** Warms every above-the-fold Sustainability query in one batch round-trip. */
export const batchPrefetchSustainability = () =>
  batchPrefetch([
    trpc.impact.getTotals.queryOptions(),
    trpc.impact.getMonthlyTrend.queryOptions(),
    trpc.impact.getByPlan.queryOptions(),
  ]);
