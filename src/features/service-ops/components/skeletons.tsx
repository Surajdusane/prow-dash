import { Skeleton } from "@/components/ui/skeleton";

/** Column-shaped placeholders, shared by the board's inline loading state and its Suspense fallback. */
export function BoardColumnsSkeleton(): React.ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, columnIndex) => (
        <div key={columnIndex} className="bg-muted/32 flex flex-col gap-2 rounded-2xl border p-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 3 }, (_, cardIndex) => (
            <Skeleton key={cardIndex} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Fallback for the kanban board while the first board query resolves. */
export function BoardSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-7 w-64 max-w-full" />
      </div>

      <BoardColumnsSkeleton />
    </div>
  );
}
