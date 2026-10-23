import { Suspense } from "react";
import type { Metadata } from "next";

import { ChartCard } from "@/components/dashboard/chart-card";
import { ChartCardSkeleton, TableCardSkeleton } from "@/components/dashboard/skeletons";
import {
  batchPrefetchLeads,
  CreateLeadButton,
  FunnelCard,
  LeadsDialogs,
  LeadsErrorBoundary,
  LeadsKpiRow,
  LeadsKpiRowSkeleton,
  LeadsTable,
  SourceConversionCard,
} from "@/features/leads";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Leads",
};

export const dynamic = "force-dynamic";

export default function LeadsPage() {
  batchPrefetchLeads();

  return (
    <HydrateClient>
      <LeadsErrorBoundary>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-2xl font-semibold">Leads</h1>
              <p className="text-muted-foreground text-sm">
                Top of the sales funnel - enquiry volume, site visits and conversions by channel.
              </p>
            </div>
            <CreateLeadButton />
          </div>

          <Suspense fallback={<LeadsKpiRowSkeleton />}>
            <LeadsKpiRow />
          </Suspense>

          <div className="grid gap-6 xl:grid-cols-2">
            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                title="Pipeline funnel"
                description="Leads that booked a visit and leads that converted, as a share of all leads."
              >
                <FunnelCard />
              </ChartCard>
            </Suspense>

            <Suspense fallback={<ChartCardSkeleton />}>
              <ChartCard
                title="Conversion by source"
                description="Each channel's leads, visits and conversions side by side."
              >
                <SourceConversionCard />
              </ChartCard>
            </Suspense>
          </div>

          <Suspense fallback={<TableCardSkeleton rows={10} />}>
            <LeadsTable />
          </Suspense>
        </div>
      </LeadsErrorBoundary>

      <LeadsDialogs />
    </HydrateClient>
  );
}
