"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Monthly litres + jars (and cumulative) over the last 24 months. */
export const useGetImpactMonthlyTrend = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.impact.getMonthlyTrend.queryOptions());
};
