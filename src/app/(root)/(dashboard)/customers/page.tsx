import { Suspense } from "react";
import type { Metadata } from "next";

import { ChartCard } from "@/components/dashboard/chart-card";
import { ChartCardSkeleton } from "@/components/dashboard/skeletons";
import {
  batchPrefetchCustomers,
  ComplaintTrendCard,
  CustomersDialogs,
  CustomersErrorBoundary,
  CustomersKpiRow,
  CustomersKpiRowSkeleton,
  RecomputeRiskButton,
  RiskDistributionCard,
  RiskTable,
  RiskTableSkeleton,
} from "@/features/customers";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Customers",
};

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  batchPrefetchCustomers();

  return (
    <HydrateClient>
      <CustomersErrorBoundary>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-2xl font-semibold">Customers</h1>
              <p className="text-muted-foreground text-sm">
                Churn and risk - score the book, surface high-risk households and act on complaints before they cancel.
              </p>
            </div>
            <RecomputeRiskButton />
          </div>

          <Suspense fallback={<CustomersKpiRowSkeleton />}>
            <CustomersKpiRow />
          </Suspense>

          <Suspense fallback={<RiskTableSkeleton rows={10} />}>
            <RiskTable />
          </Suspense>

          <div className="grid gap-6 xl:grid-cols-2">
            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                title="Risk distribution"
                description="The active book split by risk band - low, medium and high."
              >
                <RiskDistributionCard />
              </ChartCard>
            </Suspense>

            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                title="Complaint trend"
                description="Monthly complaint volume by category over the last 12 months."
              >
                <ComplaintTrendCard />
              </ChartCard>
            </Suspense>
          </div>
        </div>
      </CustomersErrorBoundary>

      <CustomersDialogs />
    </HydrateClient>
  );
}
