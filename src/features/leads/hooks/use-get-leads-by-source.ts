"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/**
 * Leads, visits and conversions per acquisition channel — powers both the
 * conversion-by-source chart and the table's source filter.
 */
export const useGetLeadsBySource = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.leads.getBySource.queryOptions());
};
