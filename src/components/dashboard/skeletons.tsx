import { Card, CardHeader, CardPanel } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Fallback for a `<ChartCard>` while its query resolves. */
export function ChartCardSkeleton(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardPanel className="p-6 pt-0">
        <Skeleton className="h-[280px] w-full" />
      </CardPanel>
    </Card>
  );
}

/** Fallback for a table card while its query resolves. */
export function TableCardSkeleton({ rows = 6 }: { rows?: number }): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-80" />
      </CardHeader>
      <CardPanel className="flex flex-col gap-3 p-6 pt-2">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </CardPanel>
    </Card>
  );
}
