import { KpiCardSkeleton } from "@/components/dashboard/kpi-card";

/** Fallback for the Leads KPI row while its query resolves. */
export function LeadsKpiRowSkeleton(): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <KpiCardSkeleton key={index} />
      ))}
    </div>
  );
}
