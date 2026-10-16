"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Tickets per 100 households for the last 90 days, by area. */
export const useGetAreaDemand = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.serviceOps.getAreaDemand.queryOptions());
};
