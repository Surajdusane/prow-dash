import { DEFAULT_SOCIETY_TABLE_STATE, toSocietyTableInput } from "@/features/societies/utils";
import { batchPrefetch, prefetch, trpc } from "@/trpc/server";

export const prefetchSocietiesKpis = () => prefetch(trpc.societies.getKpis.queryOptions());

export const prefetchGrowthTrend = () => prefetch(trpc.societies.getGrowthTrend.queryOptions());

export const prefetchAreaPenetration = () => prefetch(trpc.societies.getAreaPenetration.queryOptions());

export const prefetchSocietyList = () =>
  prefetch(trpc.societies.getList.queryOptions(toSocietyTableInput(DEFAULT_SOCIETY_TABLE_STATE)));

/** Warms every above-the-fold Societies query in one batch round-trip. */
export const batchPrefetchSocieties = () =>
  batchPrefetch([
    trpc.societies.getKpis.queryOptions(),
    trpc.societies.getGrowthTrend.queryOptions(),
    trpc.societies.getAreaPenetration.queryOptions(),
    trpc.societies.getList.queryOptions(toSocietyTableInput(DEFAULT_SOCIETY_TABLE_STATE)),
  ]);
