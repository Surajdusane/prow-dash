"use client";

import { Suspense, useDeferredValue, useState } from "react";

import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { useGetLeadList } from "@/features/leads/hooks";
import { useLeadsUiStore } from "@/features/leads/store";
import {
  DEFAULT_LEADS_TABLE_STATE,
  LEAD_ROLE_LABELS,
  LEADS_TABLE_PAGE_SIZE,
  leadSourceLabel,
  toLeadsTableInput,
  type LeadsTableState,
} from "@/features/leads/utils";
import { formatDate, formatDateKey, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { LeadsTableToolbar } from "./toolbar";

/** Column heads, shared by the rows and the fallback so they match. */
function LeadsTableHead(): React.ReactElement {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="pl-6">Lead</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Source</TableHead>
        <TableHead>Visit date</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="pr-6 text-right">Action</TableHead>
      </TableRow>
    </TableHeader>
  );
}

/** Streamed first paint: the real column heads over shimmer rows. */
function LeadsTableFallback({ rows = 10 }: { rows?: number }): React.ReactElement {
  return (
    <>
      <Table>
        <LeadsTableHead />
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

/** Rows + pager for one query key. Suspends into `LeadsTableFallback`. */
function LeadsTableRows({
  state,
  onPageChange,
}: {
  state: LeadsTableState;
  onPageChange: (page: number) => void;
}): React.ReactElement {
  const { data } = useGetLeadList(toLeadsTableInput(state));
  const openEdit = useLeadsUiStore((store) => store.openEdit);

  const { rows, total } = data;
  const totalPages = Math.max(1, Math.ceil(total / LEADS_TABLE_PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (state.page - 1) * LEADS_TABLE_PAGE_SIZE + 1;
  const rangeEnd = Math.min(state.page * LEADS_TABLE_PAGE_SIZE, total);

  return (
    <>
      <Table>
        <LeadsTableHead />

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                No leads match these filters.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="pl-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {row.societyName ?? "Society not shared"} · added {formatDate(row.createdAt)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.role ? LEAD_ROLE_LABELS[row.role] : "—"}</TableCell>
                <TableCell>
                  {row.source ? (
                    <Badge size="sm" variant="secondary">
                      {leadSourceLabel(row.source)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.visitDate ? formatDateKey(row.visitDate) : "Not visited"}
                </TableCell>
                <TableCell>
                  {row.converted ? (
                    <Badge size="sm" variant="success">
                      {`${formatNumber(row.flatsConverted ?? 0)} flat${(row.flatsConverted ?? 0) === 1 ? "" : "s"}`}
                    </Badge>
                  ) : (
                    <Badge size="sm" variant="outline">
                      In pipeline
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Button variant="ghost" size="xs" onClick={() => openEdit(row)}>
                    <Pencil />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-4 pb-6">
        <p className="text-muted-foreground text-xs">
          {total === 0
            ? "No leads to show."
            : `Showing ${formatNumber(rangeStart)}–${formatNumber(rangeEnd)} of ${formatNumber(total)} leads`}
        </p>
        <TablePagination page={state.page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </>
  );
}

/**
 * Server-paged sales pipeline, newest leads first. Filtering and paging
 * round-trip through `getList`; editing a row only flips store state (the edit
 * dialog owns the update mutation).
 *
 * Suspense-based on purpose (see `useGetLeadList`): state drives the toolbar
 * urgently while a deferred copy drives the rows, so a filter or page change
 * keeps the current rows on screen (dimmed) instead of flashing a fallback.
 */
export function LeadsTable() {
  const [state, setState] = useState<LeadsTableState>(DEFAULT_LEADS_TABLE_STATE);
  const deferredState = useDeferredValue(state);
  const isStale = deferredState !== state;

  const handleFilterChange = (patch: Partial<LeadsTableState>) => {
    setState((previous) => ({ ...previous, ...patch, page: 1 }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead pipeline</CardTitle>
        <p className="text-muted-foreground text-sm">
          Every inbound lead with its channel, visit and conversion status. Edit a row to progress it through the
          funnel.
        </p>
        <div className="pt-2">
          <LeadsTableToolbar state={state} onChange={handleFilterChange} />
        </div>
      </CardHeader>

      <CardPanel className="p-0 pt-0">
        <div className={cn("transition-opacity", isStale && "opacity-60")}>
          <Suspense fallback={<LeadsTableFallback />}>
            <LeadsTableRows
              state={deferredState}
              onPageChange={(page) => setState((previous) => ({ ...previous, page }))}
            />
          </Suspense>
        </div>
      </CardPanel>
    </Card>
  );
}
