import { DEFAULT_LEADS_TABLE_STATE, toLeadsTableInput } from "@/features/leads/utils";
import { batchPrefetch, prefetch, trpc } from "@/trpc/server";

export const prefetchLeadsKpis = () => prefetch(trpc.leads.getKpis.queryOptions());

export const prefetchFunnel = () => prefetch(trpc.leads.getFunnel.queryOptions());

export const prefetchLeadsBySource = () => prefetch(trpc.leads.getBySource.queryOptions());

export const prefetchLeadList = () =>
  prefetch(trpc.leads.getList.queryOptions(toLeadsTableInput(DEFAULT_LEADS_TABLE_STATE)));

/** Warms every above-the-fold Leads query in one batch round-trip. */
export const batchPrefetchLeads = () =>
  batchPrefetch([
    trpc.leads.getKpis.queryOptions(),
    trpc.leads.getFunnel.queryOptions(),
    trpc.leads.getBySource.queryOptions(),
    trpc.leads.getList.queryOptions(toLeadsTableInput(DEFAULT_LEADS_TABLE_STATE)),
  ]);
