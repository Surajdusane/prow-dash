"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** 18-month billed vs collected revenue trend. */
export const useGetRevenueTrend = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.overview.getRevenueTrend.queryOptions());
};
