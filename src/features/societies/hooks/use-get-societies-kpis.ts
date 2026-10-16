"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Headline portfolio numbers for the Societies KPI row. */
export const useGetSocietiesKpis = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.societies.getKpis.queryOptions());
};
