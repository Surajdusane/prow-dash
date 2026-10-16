"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import type { GetRiskTableInput } from "@/trpc/schema";

/**
 * Server-paged risk table. Suspense-based on purpose: a fire-and-forget
 * prefetch hands the promise to `HydrationBoundary`, and only suspense resolves
 * the server HTML and the client's first render through the *same* state
 * machine. With a plain `useQuery` the two sides race the promise — when it
 * happened to settle before hydration the client painted rows over the server's
 * skeleton and React flagged a hydration mismatch.
 *
 * `RiskTable` keeps the current page on screen during sorting/filtering by
 * driving this hook with a `useDeferredValue` copy of its state, so resolving
 * the next page never trips the boundary's fallback.
 */
export const useGetRiskTable = (input: GetRiskTableInput) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.customers.getRiskTable.queryOptions(input));
};
