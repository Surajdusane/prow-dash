"use client";

import { Suspense, useDeferredValue, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead } from "@/components/dashboard/sortable-table-head";
import { TableEmpty } from "@/components/dashboard/table-empty";
import { TablePagination } from "@/components/dashboard/table-pagination";
import type { RiskSort } from "@/db/queries/customers";
import { useGetRiskTable } from "@/features/customers/hooks";
import { useCustomersUiStore } from "@/features/customers/store";
import {
  DEFAULT_RISK_TABLE_STATE,
  HOUSEHOLD_STATUS_LABELS,
  PLAN_LABELS,
  RISK_TABLE_PAGE_SIZE,
  toRiskTableInput,
  type RiskTableState,
} from "@/features/customers/utils";
import { formatDateKey, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { RiskScoreCell } from "./risk-score-cell";
import { RiskTableToolbar } from "./toolbar";

function formatTenure(days: number): string {
  if (days < 90) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} mo`;
  const years = days / 365;
  return `${years >= 10 ? Math.round(years) : years.toFixed(1)} yrs`;
}

/** Column heads, shared by the rows and the fallback so they match. */
function RiskTableHead({
  state,
  onSort,
}: {
  state: RiskTableState;
  onSort: (column: RiskSort) => void;
}): React.ReactElement {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="pl-6">Household</TableHead>
        <TableHead>Society / Area</TableHead>
        <TableHead>Plan</TableHead>
        <SortableTableHead
          label="Tenure"
          column="tenure"
          activeColumn={state.sort}
          direction={state.dir}
          onSort={onSort}
        />
        <SortableTableHead
          label="Risk score"
          column="risk"
          activeColumn={state.sort}
          direction={state.dir}
          onSort={onSort}
        />
        <SortableTableHead
          label="Complaints 90d"
          column="complaints"
          activeColumn={state.sort}
          direction={state.dir}
          onSort={onSort}
          align="right"
        />
        <SortableTableHead
          label="Late + failed 6mo"
          column="latePayments"
          activeColumn={state.sort}
          direction={state.dir}
          onSort={onSort}
          align="right"
        />
        <TableHead className="text-right">Last complaint</TableHead>
        <TableHead className="pr-6">Status</TableHead>
      </TableRow>
    </TableHeader>
  );
}

/** Streamed first paint: the real column heads over shimmer rows. */
function RiskTableFallback({
  state,
  onSort,
  rows = 10,
}: {
  state: RiskTableState;
  onSort: (column: RiskSort) => void;
  rows?: number;
}): React.ReactElement {
  return (
    <>
      <Table>
        <RiskTableHead state={state} onSort={onSort} />
        <TableBody>
          {Array.from({ length: rows }, (_, index) => (
            <TableRow key={index} className="pointer-events-none">
              <TableCell colSpan={9} className="py-3 pr-6 pl-6">
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

/** Rows + pager for one query key. Suspends into `RiskTableFallback`. */
function RiskTableRows({
  state,
  onSort,
  onPageChange,
}: {
  state: RiskTableState;
  onSort: (column: RiskSort) => void;
  onPageChange: (page: number) => void;
}) {
  const { data } = useGetRiskTable(toRiskTableInput(state));
  const openHousehold = useCustomersUiStore((store) => store.openHousehold);

  const { rows, total } = data;
  const totalPages = Math.max(1, Math.ceil(total / RISK_TABLE_PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (state.page - 1) * RISK_TABLE_PAGE_SIZE + 1;
  const rangeEnd = Math.min(state.page * RISK_TABLE_PAGE_SIZE, total);

  return (
    <>
      <Table>
        <RiskTableHead state={state} onSort={onSort} />

        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty
              colSpan={9}
              title="No households match these filters"
              description="Try a different risk band, area or status."
            />
          ) : (
            rows.map((row) => (
              <TableRow key={row.householdId} className="cursor-pointer" onClick={() => openHousehold(row.householdId)}>
                <TableCell className="pl-6">
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
                  {row.planName ? (
                    <Badge size="sm" variant="secondary">
                      {PLAN_LABELS[row.planName]}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{formatTenure(row.tenureDays)}</TableCell>
                <TableCell>
                  <RiskScoreCell score={row.riskScore} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.complaints90d > 0 ? (
                    formatNumber(row.complaints90d)
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.latePayments6mo > 0 ? (
                    formatNumber(row.latePayments6mo)
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {row.lastComplaintDate ? (
                    formatDateKey(row.lastComplaintDate)
                  ) : (
                    <span className="text-muted-foreground">Never</span>
                  )}
                </TableCell>
                <TableCell className="pr-6">
                  <Badge size="sm" variant={row.status === "active" ? "secondary" : "outline"}>
                    {HOUSEHOLD_STATUS_LABELS[row.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-4 pb-6">
        <p className="text-muted-foreground text-xs">
          {total === 0
            ? "No households to show."
            : `Showing ${formatNumber(rangeStart)}–${formatNumber(rangeEnd)} of ${formatNumber(total)} households`}
        </p>
        <TablePagination page={state.page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </>
  );
}

/**
 * Server-paged book of every household, sorted by risk by default. Sorting,
 * filtering and paging all round-trip through `getRiskTable`; opening a row
 * only flips store state (the drawer owns its own `getById` query).
 *
 * Suspense-based on purpose (see `useGetRiskTable`): the prefetched promise
 * settles identically on the server and during hydration, which is what
 * prevents the hydration mismatch this table used to race. `state` drives the
 * toolbar urgently while a deferred copy drives the rows, so a sort, filter or
 * page change keeps the current rows on screen (dimmed) instead of flashing a
 * fallback - the same feel `keepPreviousData` used to provide.
 */
export function RiskTable() {
  const [state, setState] = useState<RiskTableState>(DEFAULT_RISK_TABLE_STATE);
  const deferredState = useDeferredValue(state);
  const isStale = deferredState !== state;

  const handleFilterChange = (patch: Partial<RiskTableState>) => {
    setState((previous) => ({ ...previous, ...patch, page: 1 }));
  };

  const handleSort = (column: RiskSort) => {
    setState((previous) =>
      column === previous.sort
        ? { ...previous, dir: previous.dir === "desc" ? "asc" : "desc" }
        : { ...previous, sort: column, dir: "desc" }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Household risk</CardTitle>
        <p className="text-muted-foreground text-sm">
          Every household scored from the last 90 days of complaints, payments and SLA misses - highest risk first.
        </p>
        <div className="pt-2">
          <RiskTableToolbar state={state} onChange={handleFilterChange} />
        </div>
      </CardHeader>

      <CardPanel className="p-0 pt-0">
        <div className={cn("transition-opacity", isStale && "opacity-60")}>
          <Suspense fallback={<RiskTableFallback state={deferredState} onSort={handleSort} />}>
            <RiskTableRows
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
