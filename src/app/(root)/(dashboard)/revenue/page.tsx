import { Suspense } from "react";
import type { Metadata } from "next";

import { ChartCard } from "@/components/dashboard/chart-card";
import { ChartCardSkeleton, TableCardSkeleton } from "@/components/dashboard/skeletons";
import {
  batchPrefetchRevenue,
  CohortRetentionCard,
  MrrTrendCard,
  OverdueTable,
  PaymentStatusCard,
  PlanMixTrendCard,
  RevenueErrorBoundary,
  RevenueKpiRow,
  RevenueKpiRowSkeleton,
} from "@/features/revenue";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Revenue",
};

export const dynamic = "force-dynamic";

export default function RevenuePage() {
  batchPrefetchRevenue();

  return (
    <HydrateClient>
      <RevenueErrorBoundary>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold">Revenue</h1>
            <p className="text-muted-foreground text-sm">
              Subscriptions and billing — MRR trend, plan mix, cohort retention and overdue payments.
            </p>
          </div>

          <Suspense fallback={<RevenueKpiRowSkeleton />}>
            <RevenueKpiRow />
          </Suspense>

          <Suspense fallback={<ChartCardSkeleton />}>
            <ChartCard
              title="MRR trend"
              description="Month-end recurring revenue over the last 18 months, rebuilt from subscription start and cancel dates."
            >
              <MrrTrendCard />
            </ChartCard>
          </Suspense>

          <div className="grid gap-6 xl:grid-cols-2">
            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard title="Plan mix over time" description="Active subscriptions per plan at each month-end.">
                <PlanMixTrendCard />
              </ChartCard>
            </Suspense>

            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                title="Payment outcomes"
                description="Every billing month's payments by status — paid, late, failed and pending."
              >
                <PaymentStatusCard />
              </ChartCard>
            </Suspense>
          </div>

          <Suspense fallback={<TableCardSkeleton rows={5} />}>
            <CohortRetentionCard />
          </Suspense>

          <Suspense fallback={<TableCardSkeleton rows={8} />}>
            <OverdueTable />
          </Suspense>
        </div>
      </RevenueErrorBoundary>
    </HydrateClient>
  );
}
