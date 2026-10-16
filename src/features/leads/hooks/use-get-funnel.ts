"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Leads → visits → converted counts with %-of-leads shares. */
export const useGetFunnel = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.leads.getFunnel.queryOptions());
};
