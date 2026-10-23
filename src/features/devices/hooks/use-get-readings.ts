"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

/**
 * Telemetry window for the device drawer. `keepPreviousData` keeps the current
 * 30/90-day curve on screen while the other window loads - the toggle never
 * flashes an empty chart. Disabled until a device is selected.
 */
export const useGetReadings = (dispenserId: number | null, days: 30 | 90) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.devices.getReadings.queryOptions(
      { dispenserId: dispenserId ?? 0, days },
      { enabled: dispenserId !== null, placeholderData: keepPreviousData }
    )
  );
};
