"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Payment status counts per billing month (last 12 months, zero-filled). */
export const useGetPaymentStatus = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.revenue.getPaymentStatusByMonth.queryOptions());
};
