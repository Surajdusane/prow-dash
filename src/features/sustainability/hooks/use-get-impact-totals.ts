"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** All-time impact totals for the sustainability tiles. */
export const useGetImpactTotals = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.impact.getTotals.queryOptions());
};
