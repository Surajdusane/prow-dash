"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Households whose dispensers are predicted to need service next (top 25). */
export const useGetPredictive = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.serviceOps.getPredictive.queryOptions());
};
