"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Complaint volume per month per category (last 12 months, zero-filled). */
export const useGetComplaintTrend = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.customers.getComplaintTrend.queryOptions());
};
