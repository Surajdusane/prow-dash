import { DEFAULT_RISK_TABLE_STATE, toRiskTableInput } from "@/features/customers/utils";
import { batchPrefetch, prefetch, trpc } from "@/trpc/server";

export const prefetchHouseholdKpis = () => prefetch(trpc.customers.getKpis.queryOptions());

export const prefetchRiskTable = () =>
  prefetch(trpc.customers.getRiskTable.queryOptions(toRiskTableInput(DEFAULT_RISK_TABLE_STATE)));

export const prefetchRiskDistribution = () => prefetch(trpc.customers.getRiskDistribution.queryOptions());

export const prefetchComplaintTrend = () => prefetch(trpc.customers.getComplaintTrend.queryOptions());

export const prefetchCustomerAreas = () => prefetch(trpc.customers.getAreas.queryOptions());

/**
 * Warms every above-the-fold Customers query in one pass. The household
 * profile (`getById`) is intentionally excluded - the drawer owns its own
 * query and fetches on open.
 */
export const batchPrefetchCustomers = () =>
  batchPrefetch([
    trpc.customers.getKpis.queryOptions(),
    trpc.customers.getRiskTable.queryOptions(toRiskTableInput(DEFAULT_RISK_TABLE_STATE)),
    trpc.customers.getRiskDistribution.queryOptions(),
    trpc.customers.getComplaintTrend.queryOptions(),
    trpc.customers.getAreas.queryOptions(),
  ]);
