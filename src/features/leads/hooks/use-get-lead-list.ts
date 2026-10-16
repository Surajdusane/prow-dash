"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import type { GetLeadListInput } from "@/trpc/schema";

/**
 * Server-paged lead pipeline. Suspense-based like the other paged tables: a
 * fire-and-forget prefetch hands the promise to `HydrationBoundary`, and only
 * suspense resolves the server HTML and the client's first render through the
 * same state machine.
 */
export const useGetLeadList = (input: GetLeadListInput) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.leads.getList.queryOptions(input));
};
