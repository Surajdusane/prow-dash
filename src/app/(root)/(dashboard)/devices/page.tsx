import { Suspense } from "react";
import type { Metadata } from "next";

import { Card, CardHeader, CardPanel } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/dashboard/chart-card";
import { ChartCardSkeleton } from "@/components/dashboard/skeletons";
import {
  AnomalyMixCard,
  AnomalyPanel,
  AnomalyPanelSkeleton,
  batchPrefetchDevicesOverview,
  DeviceDrawer,
  DevicesErrorBoundary,
  DevicesKpiRow,
  DevicesKpiRowSkeleton,
  FleetOnlineGauge,
  ReadingsTrendCard,
} from "@/features/devices";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Devices",
};

export const dynamic = "force-dynamic";

export default function DevicesPage() {
  batchPrefetchDevicesOverview();

  return (
    <HydrateClient>
      <DevicesErrorBoundary>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold">Devices</h1>
            <p className="text-muted-foreground text-sm">
              IoT fleet monitoring — connectivity, telemetry trends and the anomalies that need a visit.
            </p>
          </div>

          <Suspense fallback={<DevicesKpiRowSkeleton />}>
            <DevicesKpiRow />
          </Suspense>

          {/* Row 1 — gauge, trend and anomaly mix share one line. The grid's
              default stretch keeps all three cards the same height; each card
              distributes or centres its own content to fill. */}
          <div className="grid gap-6 xl:grid-cols-3">
            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                className="h-full"
                title="Anomaly mix"
                description="Flagged devices by their most urgent signal, worst 100 first."
              >
                <AnomalyMixCard />
              </ChartCard>
            </Suspense>

            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                className="h-full"
                title="Telemetry trend"
                description="Fleet-wide daily averages across every active dispenser."
              >
                <ReadingsTrendCard />
              </ChartCard>
            </Suspense>

            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                className="h-full"
                title="Fleet online"
                description="Devices reporting within the last 7 days."
              >
                <FleetOnlineGauge />
              </ChartCard>
            </Suspense>
          </div>

          {/* Row 2 — the anomaly feed owns the full width on its own row. */}
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardPanel className="p-6 pt-0">
                  <AnomalyPanelSkeleton />
                </CardPanel>
              </Card>
            }
          >
            <AnomalyPanel />
          </Suspense>
        </div>
      </DevicesErrorBoundary>

      <DeviceDrawer />
    </HydrateClient>
  );
}
