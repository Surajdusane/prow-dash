import { DEFAULT_OVERDUE_TABLE_STATE, toOverdueTableInput } from "@/features/revenue/utils";
import { batchPrefetch, prefetch, trpc } from "@/trpc/server";

export const prefetchRevenueKpis = () => prefetch(trpc.revenue.getKpis.queryOptions());

export const prefetchMrrTrend = () => prefetch(trpc.revenue.getMrrTrend.queryOptions());

export const prefetchPlanMixTrend = () => prefetch(trpc.revenue.getPlanMixTrend.queryOptions());

export const prefetchPaymentStatus = () => prefetch(trpc.revenue.getPaymentStatusByMonth.queryOptions());

export const prefetchCohortRetention = () => prefetch(trpc.revenue.getCohortRetention.queryOptions());

export const prefetchOverdue = () =>
  prefetch(trpc.revenue.getOverdue.queryOptions(toOverdueTableInput(DEFAULT_OVERDUE_TABLE_STATE)));

/** Warms every above-the-fold Revenue query in one batch round-trip. */
export const batchPrefetchRevenue = () =>
  batchPrefetch([
    trpc.revenue.getKpis.queryOptions(),
    trpc.revenue.getMrrTrend.queryOptions(),
    trpc.revenue.getPlanMixTrend.queryOptions(),
    trpc.revenue.getPaymentStatusByMonth.queryOptions(),
    trpc.revenue.getCohortRetention.queryOptions(),
    trpc.revenue.getOverdue.queryOptions(toOverdueTableInput(DEFAULT_OVERDUE_TABLE_STATE)),
  ]);
