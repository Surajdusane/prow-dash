import { Card, CardHeader, CardPanel } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCardSkeleton } from "@/components/dashboard/kpi-card";

/** Fallback for the Devices KPI row. */
export function DevicesKpiRowSkeleton(): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <KpiCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Fallback for the fleet table card while its first page resolves. */
export function FleetTableSkeleton({ rows = 10 }: { rows?: number }): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-96" />
        <div className="flex flex-wrap gap-2 pt-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-36" />
        </div>
      </CardHeader>
      <CardPanel className="p-0 pt-0">
        <div className="flex flex-col gap-3 px-6">
          {Array.from({ length: rows }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      </CardPanel>
    </Card>
  );
}

/** Fallback for the anomaly panel while the feed resolves. */
export function AnomalyPanelSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}

/** Fallback for the device drawer while the readings window resolves. */
export function DeviceDrawerSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
