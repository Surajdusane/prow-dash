import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview",
};

export const dynamic = "force-dynamic";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold">Overview</h1>
      <p className="text-muted-foreground text-sm">
        Executive summary of the ProWater network — KPIs, revenue trend, household growth and area health.
      </p>
    </div>
  );
}
