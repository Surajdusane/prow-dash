import { Suspense } from "react";
import type { Metadata } from "next";

import {
  batchPrefetchFleetTable,
  DeviceDrawer,
  DevicesErrorBoundary,
  FleetTable,
  FleetTableSkeleton,
} from "@/features/devices";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Fleet",
};

export const dynamic = "force-dynamic";

export default function FleetPage() {
  batchPrefetchFleetTable();

  return (
    <HydrateClient>
      <DevicesErrorBoundary>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold">Fleet</h1>
            <p className="text-muted-foreground text-sm">
              Every active household dispenser with its latest telemetry — filter by area, type or connectivity.
            </p>
          </div>

          <Suspense fallback={<FleetTableSkeleton rows={10} />}>
            <FleetTable />
          </Suspense>
        </div>
      </DevicesErrorBoundary>

      <DeviceDrawer />
    </HydrateClient>
  );
}
