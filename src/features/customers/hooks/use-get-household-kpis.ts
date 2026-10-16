"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Headline churn numbers for the Customers KPI row. */
export const useGetHouseholdKpis = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.customers.getKpis.queryOptions());
};
