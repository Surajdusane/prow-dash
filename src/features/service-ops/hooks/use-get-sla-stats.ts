"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Open/overdue counts, average resolution time and the 90-day SLA miss rate. */
export const useGetSlaStats = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.serviceOps.getSlaStats.queryOptions());
};
