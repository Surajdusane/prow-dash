"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import type { GetBoardInput } from "@/trpc/schema";

/**
 * Kanban board data. Deliberately a non-suspense query: `useSuspenseQuery`
 * ignores `placeholderData`, so every filter change re-suspended and swapped
 * the whole board - toolbar and search box included - for the fallback
 * skeleton. `useQuery` + `keepPreviousData` keeps the current columns on
 * screen while the next set loads, and the server prefetch still paints the
 * first board without an extra client fetch.
 */
export const useGetBoard = (input: GetBoardInput) => {
  const trpc = useTRPC();

  return useQuery(trpc.serviceOps.getBoard.queryOptions(input, { placeholderData: keepPreviousData }));
};
