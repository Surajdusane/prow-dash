import { KpiCardSkeleton } from "@/components/dashboard/kpi-card";

/** Fallback for the Revenue KPI row while its query resolves. */
export function RevenueKpiRowSkeleton(): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => (
        <KpiCardSkeleton key={index} />
      ))}
    </div>
  );
}
