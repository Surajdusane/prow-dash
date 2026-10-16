"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** MRR reconstructed at each of the last 18 month-ends. */
export const useGetMrrTrend = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.revenue.getMrrTrend.queryOptions());
};
