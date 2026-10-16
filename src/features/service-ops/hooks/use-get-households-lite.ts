"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Lightweight household list (`#id — flat, society`) for the create-ticket dialog. */
export const useGetHouseholdsLite = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.serviceOps.getHouseholdsLite.queryOptions());
};
