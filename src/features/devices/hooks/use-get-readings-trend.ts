"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Fleet-wide daily TDS/purity averages for the overview trend card. */
export const useGetReadingsTrend = (days: 30 | 90) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.devices.getReadingsTrend.queryOptions({ days }));
};
