"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Headline pipeline numbers for the Leads KPI row. */
export const useGetLeadsKpis = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.leads.getKpis.queryOptions());
};
