"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Fleet health headline numbers for the Devices KPI row. */
export const useGetFleetStats = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.devices.getFleetStats.queryOptions());
};
