"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Cumulative active households per area over the last 24 months. */
export const useGetGrowthTrend = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.societies.getGrowthTrend.queryOptions());
};
