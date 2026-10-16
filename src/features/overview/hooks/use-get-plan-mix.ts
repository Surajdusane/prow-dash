"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Active subscription mix across the three plans. */
export const useGetPlanMix = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.overview.getPlanMix.queryOptions());
};
