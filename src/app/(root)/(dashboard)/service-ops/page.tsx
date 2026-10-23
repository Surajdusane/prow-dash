import { Suspense } from "react";
import type { Metadata } from "next";

import { ChartCard } from "@/components/dashboard/chart-card";
import { ChartCardSkeleton, TableCardSkeleton } from "@/components/dashboard/skeletons";
import {
  AreaDemandCard,
  batchPrefetchServiceOps,
  BoardSkeleton,
  CreateTicketButton,
  PredictiveTable,
  ServiceBoard,
  ServiceOpsDialogs,
  ServiceOpsErrorBoundary,
  ServiceOpsKpiRow,
  ServiceOpsKpiRowSkeleton,
  SlaGaugeCard,
  TechnicianWorkloadCard,
} from "@/features/service-ops";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Service Ops",
};

export const dynamic = "force-dynamic";

export default function ServiceOpsPage() {
  batchPrefetchServiceOps();

  return (
    <HydrateClient>
      <ServiceOpsErrorBoundary>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-2xl font-semibold">Service Ops</h1>
              <p className="text-muted-foreground text-sm">
                Field operations for the ProWater network - triage the board, balance technician load and beat the SLA.
              </p>
            </div>
            <CreateTicketButton />
          </div>

          <Suspense fallback={<ServiceOpsKpiRowSkeleton />}>
            <ServiceOpsKpiRow />
          </Suspense>

          <Suspense fallback={<BoardSkeleton />}>
            <ServiceBoard />
          </Suspense>

          <div className="grid gap-6 xl:grid-cols-3">
            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                title="Area demand"
                description="Tickets raised per area in the last 90 days. Hover for demand density and infra age."
                className="xl:col-span-2"
              >
                <AreaDemandCard />
              </ChartCard>
            </Suspense>

            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard title="SLA performance" description="Resolved within target, last 90 days.">
                <SlaGaugeCard />
              </ChartCard>
            </Suspense>
          </div>

          <Suspense fallback={<ChartCardSkeleton />}>
            <ChartCard
              title="Technician workload"
              description="Open load versus 30-day throughput for every technician, ranked by current queue."
            >
              <TechnicianWorkloadCard />
            </ChartCard>
          </Suspense>

          <Suspense fallback={<TableCardSkeleton rows={10} />}>
            <PredictiveTable />
          </Suspense>
        </div>
      </ServiceOpsErrorBoundary>

      <ServiceOpsDialogs />
    </HydrateClient>
  );
}
