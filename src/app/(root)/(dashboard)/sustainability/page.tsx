import { Suspense } from "react";
import type { Metadata } from "next";

import { ChartCard } from "@/components/dashboard/chart-card";
import { ChartCardSkeleton } from "@/components/dashboard/skeletons";
import {
  batchPrefetchSustainability,
  ByPlanCard,
  ImpactTiles,
  ImpactTilesSkeleton,
  JarsTrendCard,
  LitresTrendCard,
  MethodNoteCard,
  SustainabilityErrorBoundary,
} from "@/features/sustainability";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Sustainability",
};

export const dynamic = "force-dynamic";

export default function SustainabilityPage() {
  batchPrefetchSustainability();

  return (
    <HydrateClient>
      <SustainabilityErrorBoundary>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold">Sustainability</h1>
            <p className="text-muted-foreground text-sm">
              Environmental impact - litres served, jars avoided and monthly impact trend.
            </p>
          </div>

          <Suspense fallback={<ImpactTilesSkeleton />}>
            <ImpactTiles />
          </Suspense>

          <div className="grid gap-6 xl:grid-cols-2">
            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                title="Cumulative litres served"
                description="Every estimated litre since the first subscription, month by month."
              >
                <LitresTrendCard />
              </ChartCard>
            </Suspense>

            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                title="Cumulative jars avoided"
                description="The same litres story told as 20 L single-use jars displaced."
              >
                <JarsTrendCard />
              </ChartCard>
            </Suspense>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                title="Impact by plan"
                description="All-time litres served per plan, with the jars each plan's households kept out of circulation."
                className="xl:col-span-2"
              >
                <ByPlanCard />
              </ChartCard>
            </Suspense>

            <MethodNoteCard />
          </div>
        </div>
      </SustainabilityErrorBoundary>
    </HydrateClient>
  );
}
