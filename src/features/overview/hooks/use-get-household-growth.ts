"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** 24-month cumulative household growth (active + cancelled). */
export const useGetHouseholdGrowth = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.overview.getHouseholdGrowth.queryOptions());
};
