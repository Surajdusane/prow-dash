"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import type { GetOverdueInput } from "@/trpc/schema";

/**
 * Server-paged late/failed payments. Suspense-based like the other paged
 * tables: a fire-and-forget prefetch hands the promise to `HydrationBoundary`,
 * and only suspense resolves the server HTML and the client's first render
 * through the same state machine.
 */
export const useGetOverdue = (input: GetOverdueInput) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.revenue.getOverdue.queryOptions(input));
};
