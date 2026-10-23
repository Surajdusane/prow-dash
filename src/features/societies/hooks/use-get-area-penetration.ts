"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/**
 * Penetration, infrastructure age and ticket intensity per area - powers both
 * the penetration card and the society table's area filter.
 */
export const useGetAreaPenetration = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.societies.getAreaPenetration.queryOptions());
};
