"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Area options for the risk table's area filter. */
export const useGetAreaOptions = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.customers.getAreas.queryOptions());
};
