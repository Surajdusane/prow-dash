"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** All-time litres served (and jars avoided) split by plan. */
export const useGetImpactByPlan = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.impact.getByPlan.queryOptions());
};
