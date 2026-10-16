"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/** Open load and 30-day throughput for every technician (also powers assign selects). */
export const useGetTechnicianWorkload = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.serviceOps.getTechnicianWorkload.queryOptions());
};
