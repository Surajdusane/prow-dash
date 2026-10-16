"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import type { GetSocietyListInput } from "@/trpc/schema";

/**
 * Server-paged society book. Suspense-based like the other paged tables: a
 * fire-and-forget prefetch hands the promise to `HydrationBoundary`, and only
 * suspense resolves the server HTML and the client's first render through the
 * same state machine.
 */
export const useGetSocietyList = (input: GetSocietyListInput) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.societies.getList.queryOptions(input));
};
