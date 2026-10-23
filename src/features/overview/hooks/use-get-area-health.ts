"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Per-area health strip - households, open tickets, avg TDS, SLA met %. */
export const useGetAreaHealth = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.overview.getAreaHealth.queryOptions());
};
