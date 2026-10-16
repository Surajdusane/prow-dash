"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Risk-band split of the active book (donut chart + high-risk KPI). */
export const useGetRiskDistribution = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.customers.getRiskDistribution.queryOptions());
};
