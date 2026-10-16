import { KpiCardSkeleton } from "@/components/dashboard/kpi-card";

/** Fallback for the Sustainability tiles while their query resolves. */
export function ImpactTilesSkeleton(): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <KpiCardSkeleton key={index} />
      ))}
    </div>
  );
}
