"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Join-month cohorts × months-since-join retention matrix. */
export const useGetCohortRetention = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.revenue.getCohortRetention.queryOptions());
};
