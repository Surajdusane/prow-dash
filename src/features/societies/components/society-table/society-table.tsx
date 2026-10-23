"use client";

import { Suspense, useDeferredValue, useState } from "react";

import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead } from "@/components/dashboard/sortable-table-head";
import { TableEmpty } from "@/components/dashboard/table-empty";
import { TablePagination } from "@/components/dashboard/table-pagination";
import type { SocietySort } from "@/db/queries/societies";
import { useGetSocietyList } from "@/features/societies/hooks";
import { useSocietiesUiStore } from "@/features/societies/store";
import {
  DEFAULT_SOCIETY_TABLE_STATE,
  SOCIETY_TABLE_PAGE_SIZE,
  toSocietyTableInput,
  type SocietyTableState,
} from "@/features/societies/utils";
import { formatDateKey, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { SocietyTableToolbar } from "./toolbar";

/** Mini progress bar + percentage for a society's penetration. */
function PenetrationCell({ pct }: { pct: number }): React.ReactElement {
  return (
    <div className="flex items-center gap-2.5">
      <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-sky-600 dark:bg-sky-400"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <span className="text-sm tabular-nums">{pct}%</span>
    </div>
  );
}

/** Column heads, shared by the rows and the fallback so they match. */
function SocietyTableHead({
  state,
  onSort,
}: {
  state: SocietyTableState;
  onSort: (column: SocietySort) => void;
}): React.ReactElement {
  return (
    <TableHeader>
      <TableRow>
        <SortableTableHead
          label="Society"
          column="name"
          activeColumn={state.sort}
          direction={state.dir}
          onSort={onSort}
          className="pl-6"
        />
        <SortableTableHead
          label="Flats"
          column="totalFlats"
          activeColumn={state.sort}
          direction={state.dir}
          onSort={onSort}
          align="right"
        />
        <SortableTableHead
          label="Subscribed"
          column="subscribed"
          activeColumn={state.sort}
          direction={state.dir}
          onSort={onSort}
          align="right"
        />
        <SortableTableHead
          label="Penetration"
          column="penetration"
          activeColumn={state.sort}
          direction={state.dir}
          onSort={onSort}
        />
        <SortableTableHead
          label="Open tickets"
          column="openTickets"
          activeColumn={state.sort}
          direction={state.dir}
          onSort={onSort}
          align="right"
        />
        <SortableTableHead
          label="Avg TDS 30d"
          column="avgTds30d"
          activeColumn={state.sort}
          direction={state.dir}
          onSort={onSort}
          align="right"
          className="pr-6"
        />
      </TableRow>
    </TableHeader>
  );
}

/** Streamed first paint: the real column heads over shimmer rows. */
function SocietyTableFallback({
  state,
  onSort,
  rows = 10,
}: {
  state: SocietyTableState;
  onSort: (column: SocietySort) => void;
  rows?: number;
}): React.ReactElement {
  return (
    <>
      <Table>
        <SocietyTableHead state={state} onSort={onSort} />
        <TableBody>
          {Array.from({ length: rows }, (_, index) => (
            <TableRow key={index} className="pointer-events-none">
              <TableCell colSpan={6} className="py-3 pr-6 pl-6">
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

/** Rows + pager for one query key. Suspends into `SocietyTableFallback`. */
function SocietyTableRows({
  state,
  onSort,
  onPageChange,
}: {
  state: SocietyTableState;
  onSort: (column: SocietySort) => void;
  onPageChange: (page: number) => void;
}): React.ReactElement {
  const { data } = useGetSocietyList(toSocietyTableInput(state));
  const openSociety = useSocietiesUiStore((store) => store.openSociety);

  const { rows, total } = data;
  const totalPages = Math.max(1, Math.ceil(total / SOCIETY_TABLE_PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (state.page - 1) * SOCIETY_TABLE_PAGE_SIZE + 1;
  const rangeEnd = Math.min(state.page * SOCIETY_TABLE_PAGE_SIZE, total);

  return (
    <>
      <Table>
        <SocietyTableHead state={state} onSort={onSort} />

        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty
              colSpan={6}
              title="No societies match these filters"
              description="Try a different area, or clear the search."
            />
          ) : (
            rows.map((row) => (
              <TableRow key={row.societyId} className="cursor-pointer" onClick={() => openSociety(row.societyId)}>
                <TableCell className="pl-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{row.societyName}</span>
                    <span className="text-muted-foreground text-xs">
                      {row.areaName} · onboarded {formatDateKey(row.onboardedDate)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(row.totalFlats)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(row.subscribed)}</TableCell>
                <TableCell>
                  <PenetrationCell pct={row.penetrationPct} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.openTickets > 0 ? (
                    formatNumber(row.openTickets)
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="pr-6 text-right tabular-nums">
                  {row.avgTds30d > 0 ? formatNumber(row.avgTds30d) : <span className="text-muted-foreground">-</span>}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-4 pb-6">
        <p className="text-muted-foreground text-xs">
          {total === 0
            ? "No societies to show."
            : `Showing ${formatNumber(rangeStart)}–${formatNumber(rangeEnd)} of ${formatNumber(total)} societies`}
        </p>
        <TablePagination page={state.page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </>
  );
}

/**
 * Server-paged book of every society, highest penetration first. Sorting,
 * searching, filtering and paging all round-trip through `getList`; opening a
 * row only flips store state (the drawer owns its own `getById` query).
 *
 * Suspense-based on purpose (see `useGetSocietyList`): state drives the toolbar
 * urgently while a deferred copy drives the rows, so a sort, filter, search or
 * page change keeps the current rows on screen (dimmed) instead of flashing a
 * fallback.
 */
export function SocietyTable() {
  const [state, setState] = useState<SocietyTableState>(DEFAULT_SOCIETY_TABLE_STATE);
  const deferredState = useDeferredValue(state);
  const isStale = deferredState !== state;

  const handleFilterChange = (patch: Partial<SocietyTableState>) => {
    setState((previous) => ({ ...previous, ...patch, page: 1 }));
  };

  const handleSort = (column: SocietySort) => {
    setState((previous) =>
      column === previous.sort
        ? { ...previous, dir: previous.dir === "desc" ? "asc" : "desc" }
        : { ...previous, sort: column, dir: column === "name" ? "asc" : "desc" }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Society book</CardTitle>
        <p className="text-muted-foreground text-sm">
          Every onboarded society with its coverage, service load and water quality. Open a row for the full profile.
        </p>
        <div className="pt-2">
          <SocietyTableToolbar state={state} onChange={handleFilterChange} />
        </div>
      </CardHeader>

      <CardPanel className="p-0 pt-0">
        <div className={cn("transition-opacity", isStale && "opacity-60")}>
          <Suspense fallback={<SocietyTableFallback state={deferredState} onSort={handleSort} />}>
            <SocietyTableRows
              state={deferredState}
              onSort={handleSort}
              onPageChange={(page) => setState((previous) => ({ ...previous, page }))}
            />
          </Suspense>
        </div>
      </CardPanel>
    </Card>
  );
}
