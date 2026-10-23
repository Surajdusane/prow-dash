"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Overview KPI row - active households, MRR, churn, tickets, new joins, purity. */
export const useGetOverviewKpis = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.overview.getKpis.queryOptions());
};
