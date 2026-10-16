"use client";

import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/**
 * Full society profile for the drawer. Deliberately its own non-suspense
 * query: opening a row must never re-render or refetch the society table, and
 * the drawer can show an inline skeleton while the profile loads.
 */
export const useGetSocietyDetail = (societyId: number | null) => {
  const trpc = useTRPC();

  return useQuery(trpc.societies.getById.queryOptions({ societyId: societyId ?? 0 }, { enabled: societyId !== null }));
};
