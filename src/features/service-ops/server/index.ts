import { batchPrefetch, prefetch, trpc } from "@/trpc/server";

export const prefetchBoard = () => prefetch(trpc.serviceOps.getBoard.queryOptions({}));

export const prefetchAreaDemand = () => prefetch(trpc.serviceOps.getAreaDemand.queryOptions());

export const prefetchPredictive = () => prefetch(trpc.serviceOps.getPredictive.queryOptions());

export const prefetchSlaStats = () => prefetch(trpc.serviceOps.getSlaStats.queryOptions());

export const prefetchTechnicianWorkload = () => prefetch(trpc.serviceOps.getTechnicianWorkload.queryOptions());

export const prefetchHouseholdsLite = () => prefetch(trpc.serviceOps.getHouseholdsLite.queryOptions());

/** Warms every Service Ops query in one pass for the server page. */
export const batchPrefetchServiceOps = () =>
  batchPrefetch([
    trpc.serviceOps.getBoard.queryOptions({}),
    trpc.serviceOps.getAreaDemand.queryOptions(),
    trpc.serviceOps.getPredictive.queryOptions(),
    trpc.serviceOps.getSlaStats.queryOptions(),
    trpc.serviceOps.getTechnicianWorkload.queryOptions(),
    trpc.serviceOps.getHouseholdsLite.queryOptions(),
  ]);
