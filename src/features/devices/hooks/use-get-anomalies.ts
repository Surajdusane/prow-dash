"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Severity-sorted anomaly feed for the fleet. */
export const useGetAnomalies = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.devices.getAnomalies.queryOptions());
};
