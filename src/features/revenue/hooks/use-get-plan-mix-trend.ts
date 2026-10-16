"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Active subscription count per plan at each of the last 18 month-ends. */
export const useGetPlanMixTrend = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.revenue.getPlanMixTrend.queryOptions());
};
