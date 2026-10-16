"use client";

import { Suspense, useDeferredValue, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { useGetFleet } from "@/features/devices/hooks";
import { useDevicesUiStore } from "@/features/devices/store";
import {
  DEFAULT_FLEET_TABLE_STATE,
  DISPENSER_TYPE_LABELS,
  flagBadgeVariant,
  FLEET_FLAG_LABELS,
  FLEET_PAGE_SIZE,
  formatRelativeTime,
  toFleetTableInput,
  type FleetTableState,
} from "@/features/devices/utils";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { FleetTableToolbar } from "./toolbar";

/** Mirrors the server's filter-due threshold (max natural filter cycle). */
const SERVICE_DUE_DAYS = 75;

function tdsTone(tds: number | null): string {
  if (tds === null) return "text-muted-foreground";
  if (tds > 450) return "text-rose-600 dark:text-rose-400";
  if (tds >= 400) return "text-amber-600 dark:text-amber-400";
  return "text-foreground";
}

function purityTone(purity: number | null): string {
  if (purity === null) return "text-muted-foreground";
  if (purity < 85) return "text-rose-600 dark:text-rose-400";
  if (purity < 90) return "text-amber-600 dark:text-amber-400";
  return "text-foreground";
}

function OnlineDot({ isOnline }: { isOnline: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className={cn("size-1.5 rounded-full", isOnline ? "bg-emerald-500" : "bg-rose-500")} />
      {isOnline ? "Online" : "Offline"}
    </span>
  );
}

/** Static column heads, shared by the rows and the fallback so they match. */
function FleetTableHead(): React.ReactElement {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="pl-6">Device</TableHead>
        <TableHead>Household</TableHead>
        <TableHead>Society / Area</TableHead>
        <TableHead>Type</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Last reading</TableHead>
        <TableHead className="text-right">TDS</TableHead>
        <TableHead className="text-right">pH</TableHead>
        <TableHead className="text-right">Purity</TableHead>
        <TableHead className="text-right">Filter age</TableHead>
        <TableHead className="pr-6">Flag</TableHead>
      </TableRow>
    </TableHeader>
  );
}

/** Streamed first paint: the real column heads over shimmer rows. */
function FleetTableFallback({ rows = 10 }: { rows?: number }): React.ReactElement {
  return (
    <>
      <Table>
        <FleetTableHead />
        <TableBody>
          {Array.from({ length: rows }, (_, index) => (
            <TableRow key={index} className="pointer-events-none">
              <TableCell colSpan={11} className="py-3 pr-6 pl-6">
                <Skeleton className="h-5 w-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center px-6 pt-4 pb-6">
        <Skeleton className="h-4 w-44" />
      </div>
    </>
  );
}

/** Rows + pager for one query key. Suspends into `FleetTableFallback`. */
function FleetTableRows({ state, onPageChange }: { state: FleetTableState; onPageChange: (page: number) => void }) {
  const { data } = useGetFleet(toFleetTableInput(state));
  const openDispenser = useDevicesUiStore((store) => store.openDispenser);

  const { rows, total } = data;
  const totalPages = Math.max(1, Math.ceil(total / FLEET_PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (state.page - 1) * FLEET_PAGE_SIZE + 1;
  const rangeEnd = Math.min(state.page * FLEET_PAGE_SIZE, total);

  return (
    <>
      <Table>
        <FleetTableHead />

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-muted-foreground py-10 text-center">
                No devices match these filters.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.dispenserId} className="cursor-pointer" onClick={() => openDispenser(row.dispenserId)}>
                <TableCell className="pl-6">
                  <span className="font-mono text-xs">#{row.dispenserId}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Flat {row.flatNumber}</span>
                    <span className="text-muted-foreground text-xs">{row.residentName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span>{row.societyName}</span>
                    <span className="text-muted-foreground text-xs">{row.areaName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge size="sm" variant="secondary">
                    {DISPENSER_TYPE_LABELS[row.type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <OnlineDot isOnline={row.isOnline} />
                </TableCell>
                <TableCell>
                  {row.lastReadingAt ? (
                    <span className="text-muted-foreground">{formatRelativeTime(row.lastReadingAt)}</span>
                  ) : (
                    <span className="text-muted-foreground">Never</span>
                  )}
                </TableCell>
                <TableCell className={cn("text-right font-medium tabular-nums", tdsTone(row.latestTds))}>
                  {row.latestTds === null ? "—" : `${formatNumber(row.latestTds)} ppm`}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.latestPh === null ? <span className="text-muted-foreground">—</span> : row.latestPh.toFixed(1)}
                </TableCell>
                <TableCell className={cn("text-right font-medium tabular-nums", purityTone(row.latestPurity))}>
                  {row.latestPurity === null ? "—" : `${row.latestPurity.toFixed(1)}%`}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.filterAgeDays >= SERVICE_DUE_DAYS ? (
                    <Badge size="sm" variant="warning">
                      {row.filterAgeDays} days
                    </Badge>
                  ) : (
                    `${row.filterAgeDays} days`
                  )}
                </TableCell>
                <TableCell className="pr-6">
                  {row.flag === null ? (
                    <Badge size="sm" variant="success">
                      OK
                    </Badge>
                  ) : (
                    <Badge size="sm" variant={flagBadgeVariant(row.flag)}>
                      {FLEET_FLAG_LABELS[row.flag]}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-4 pb-6">
        <p className="text-muted-foreground text-xs">
          {total === 0
            ? "No devices to show."
            : `Showing ${formatNumber(rangeStart)}–${formatNumber(rangeEnd)} of ${formatNumber(total)} devices`}
        </p>
        <TablePagination page={state.page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </>
  );
}

/**
 * Server-paged fleet inventory. Filters and paging round-trip through
 * `getFleet`; opening a row only flips store state (the drawer owns its own
 * windowed readings query).
 *
 * Suspense-based on purpose (see `useGetFleet`): the prefetched promise settles
 * identically on the server and during hydration, which is what prevents the
 * hydration mismatch this table used to race. `state` drives the toolbar
 * urgently while a deferred copy drives the rows, so a filter or page change
 * keeps the current rows on screen (dimmed) instead of flashing a fallback —
 * the same feel `keepPreviousData` used to provide.
 */
export function FleetTable() {
  const [state, setState] = useState<FleetTableState>(DEFAULT_FLEET_TABLE_STATE);
  const deferredState = useDeferredValue(state);
  const isStale = deferredState !== state;

  const handleFilterChange = (patch: Partial<FleetTableState>) => {
    setState((previous) => ({ ...previous, ...patch, page: 1 }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All devices</CardTitle>
        <p className="text-muted-foreground text-sm">
          Oldest filter first — click a row for telemetry and the full reading history.
        </p>
        <div className="pt-2">
          <FleetTableToolbar state={state} onChange={handleFilterChange} />
        </div>
      </CardHeader>

      <CardPanel className="p-0 pt-0">
        <div className={cn("transition-opacity", isStale && "opacity-60")}>
          <Suspense fallback={<FleetTableFallback />}>
            <FleetTableRows
              state={deferredState}
              onPageChange={(page) => setState((previous) => ({ ...previous, page }))}
            />
          </Suspense>
        </div>
      </CardPanel>
    </Card>
  );
}
