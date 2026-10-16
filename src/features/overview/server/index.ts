import { batchPrefetch, prefetch, trpc } from "@/trpc/server";

export const prefetchOverviewKpis = () => prefetch(trpc.overview.getKpis.queryOptions());

export const prefetchRevenueTrend = () => prefetch(trpc.overview.getRevenueTrend.queryOptions());

export const prefetchHouseholdGrowth = () => prefetch(trpc.overview.getHouseholdGrowth.queryOptions());

export const prefetchPlanMix = () => prefetch(trpc.overview.getPlanMix.queryOptions());

export const prefetchAreaHealth = () => prefetch(trpc.overview.getAreaHealth.queryOptions());

/** Warms every Overview query in one pass for the server page. */
export const batchPrefetchOverview = () =>
  batchPrefetch([
    trpc.overview.getKpis.queryOptions(),
    trpc.overview.getRevenueTrend.queryOptions(),
    trpc.overview.getHouseholdGrowth.queryOptions(),
    trpc.overview.getPlanMix.queryOptions(),
    trpc.overview.getAreaHealth.queryOptions(),
  ]);
