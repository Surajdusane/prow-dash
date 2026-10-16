"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** MRR / ARPU / active subs / failed share / 90-day collections rate. */
export const useGetRevenueKpis = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.revenue.getKpis.queryOptions());
};
