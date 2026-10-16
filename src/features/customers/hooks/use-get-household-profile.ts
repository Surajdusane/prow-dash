"use client";

import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/**
 * Full household profile for the drawer. Deliberately its own non-suspense
 * query: opening a row must never re-render or refetch the risk table, and the
 * drawer can show an inline skeleton while the profile loads.
 */
export const useGetHouseholdProfile = (householdId: number | null) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.customers.getById.queryOptions({ householdId: householdId ?? 0 }, { enabled: householdId !== null })
  );
};
