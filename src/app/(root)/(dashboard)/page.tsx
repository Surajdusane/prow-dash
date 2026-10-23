import { Suspense } from "react";
import type { Metadata } from "next";

import { ChartCard } from "@/components/dashboard/chart-card";
import { ChartCardSkeleton, TableCardSkeleton } from "@/components/dashboard/skeletons";
import {
  AreaHealthCard,
  batchPrefetchOverview,
  HouseholdGrowthCard,
  KpiRowSkeleton,
  OverviewErrorBoundary,
  OverviewKpiRow,
  PlanMixCard,
  RevenueTrendCard,
} from "@/features/overview";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Overview",
};

export const dynamic = "force-dynamic";

export default function OverviewPage() {
  batchPrefetchOverview();

  return (
    <HydrateClient>
      <OverviewErrorBoundary>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold">Overview</h1>
            <p className="text-muted-foreground text-sm">
              Executive summary of the ProWater network - KPIs, revenue health, household growth and area performance.
            </p>
          </div>

          <Suspense fallback={<KpiRowSkeleton />}>
            <OverviewKpiRow />
          </Suspense>

          <div className="grid gap-6 xl:grid-cols-2">
            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard title="Billing trend" description="Billed vs collected, last 18 months.">
                <RevenueTrendCard />
              </ChartCard>
            </Suspense>

            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                title="Household growth"
                description="Cumulative active and cancelled households, last 24 months."
              >
                <HouseholdGrowthCard />
              </ChartCard>
            </Suspense>

            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard title="Plan mix" description="Active subscriptions by plan.">
                <PlanMixCard />
              </ChartCard>
            </Suspense>
          </div>

          <Suspense fallback={<TableCardSkeleton />}>
            <AreaHealthCard />
          </Suspense>
        </div>
      </OverviewErrorBoundary>
    </HydrateClient>
  );
}
