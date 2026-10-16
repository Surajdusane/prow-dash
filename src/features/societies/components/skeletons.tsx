import { Skeleton } from "@/components/ui/skeleton";
import { KpiCardSkeleton } from "@/components/dashboard/kpi-card";

/** Fallback for the Societies KPI row while its query resolves. */
export function SocietiesKpiRowSkeleton(): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <KpiCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Fallback for the society drawer while `getById` resolves. */
export function SocietyDrawerSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
