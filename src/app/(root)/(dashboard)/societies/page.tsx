import { Suspense } from "react";
import type { Metadata } from "next";

import { ChartCard } from "@/components/dashboard/chart-card";
import { ChartCardSkeleton, TableCardSkeleton } from "@/components/dashboard/skeletons";
import {
  AreaPenetrationCard,
  batchPrefetchSocieties,
  GrowthTrendCard,
  SocietiesErrorBoundary,
  SocietiesKpiRow,
  SocietiesKpiRowSkeleton,
  SocietyDrawer,
  SocietyTable,
} from "@/features/societies";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Societies",
};

export const dynamic = "force-dynamic";

export default function SocietiesPage() {
  batchPrefetchSocieties();

  return (
    <HydrateClient>
      <SocietiesErrorBoundary>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold">Societies</h1>
            <p className="text-muted-foreground text-sm">
              Expansion and penetration - onboarding growth, coverage by area and the full society book.
            </p>
          </div>

          <Suspense fallback={<SocietiesKpiRowSkeleton />}>
            <SocietiesKpiRow />
          </Suspense>

          <div className="grid gap-6 xl:grid-cols-2">
            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                title="Onboarding growth"
                description="Cumulative active households per area over the last 24 months - top eight areas plus everything else."
              >
                <GrowthTrendCard />
              </ChartCard>
            </Suspense>

            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                title="Penetration by area"
                description="Active households as a share of flats covered, highest first."
              >
                <AreaPenetrationCard />
              </ChartCard>
            </Suspense>
          </div>

          <Suspense fallback={<TableCardSkeleton rows={10} />}>
            <SocietyTable />
          </Suspense>
        </div>
      </SocietiesErrorBoundary>

      <SocietyDrawer />
    </HydrateClient>
  );
}
