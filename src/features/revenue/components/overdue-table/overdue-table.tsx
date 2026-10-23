"use client";

import { Suspense, useDeferredValue, useState } from "react";

import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableEmpty } from "@/components/dashboard/table-empty";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { useGetOverdue } from "@/features/revenue/hooks";
import {
  daysLate,
  DEFAULT_OVERDUE_TABLE_STATE,
  OVERDUE_PAGE_SIZE,
  PAYMENT_STATUS_LABELS,
  paymentStatusVariant,
  toOverdueTableInput,
  type OverdueTableState,
} from "@/features/revenue/utils";
import { formatDateKey, formatInr, formatMonth, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { MarkPaidButton } from "./mark-paid-button";

/** Column heads, shared by the rows and the fallback so they match. */
function OverdueTableHead(): React.ReactElement {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="pl-6">Household</TableHead>
        <TableHead>Society</TableHead>
        <TableHead>Billing month</TableHead>
        <TableHead className="text-right">Amount</TableHead>
        <TableHead className="text-right">Days late</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="pr-6 text-right">Action</TableHead>
      </TableRow>
    </TableHeader>
  );
}

/** Streamed first paint: the real column heads over shimmer rows. */
function OverdueTableFallback({ rows = 8 }: { rows?: number }): React.ReactElement {
  return (
    <>
      <Table>
        <OverdueTableHead />
        <TableBody>
          {Array.from({ length: rows }, (_, index) => (
            <TableRow key={index} className="pointer-events-none">
              <TableCell colSpan={7} className="py-3 pr-6 pl-6">
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

/** Rows + pager for one query key. Suspends into `OverdueTableFallback`. */
function OverdueTableRows({
  state,
  onPageChange,
}: {
  state: OverdueTableState;
  onPageChange: (page: number) => void;
}): React.ReactElement {
  const { data } = useGetOverdue(toOverdueTableInput(state));

  const { rows, total } = data;
  const totalPages = Math.max(1, Math.ceil(total / OVERDUE_PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (state.page - 1) * OVERDUE_PAGE_SIZE + 1;
  const rangeEnd = Math.min(state.page * OVERDUE_PAGE_SIZE, total);

  return (
    <>
      <Table>
        <OverdueTableHead />

        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty
              colSpan={7}
              icon={<CheckCircle2 />}
              title="No overdue payments"
              description="Late and failed payments land here - collections are on track."
            />
          ) : (
            rows.map((row) => (
              <TableRow key={row.paymentId}>
                <TableCell className="pl-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Flat {row.flatNumber}</span>
                    <span className="text-muted-foreground text-xs">{row.residentName}</span>
                  </div>
                </TableCell>
                <TableCell>{row.societyName}</TableCell>
                <TableCell className="text-muted-foreground">{formatMonth(row.billingMonth)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatInr(row.amount)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.paidDate === null ? (
                    `${formatNumber(daysLate(row.billingMonth))}d`
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge size="sm" variant={paymentStatusVariant(row.status)}>
                    {PAYMENT_STATUS_LABELS[row.status]}
                  </Badge>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  {row.paidDate === null ? (
                    <MarkPaidButton paymentId={row.paymentId} />
                  ) : (
                    <span className="text-muted-foreground text-xs">Paid {formatDateKey(row.paidDate)}</span>
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
            ? "No overdue payments to show."
            : `Showing ${formatNumber(rangeStart)}–${formatNumber(rangeEnd)} of ${formatNumber(total)} payments`}
        </p>
        <TablePagination page={state.page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </>
  );
}

/**
 * Server-paged book of late and failed payments. Marking one paid invalidates
 * the KPI row, payment-status chart and this list together, so the row leaves
 * the table as soon as the mutation settles.
 *
 * Suspense-based like the other paged tables (see `useGetOverdue`): the
 * prefetched promise settles identically on the server and during hydration.
 * Page changes run through `useDeferredValue` so the current rows stay on
 * screen (dimmed) while the next page loads.
 */
export function OverdueTable(): React.ReactElement {
  const [state, setState] = useState<OverdueTableState>(DEFAULT_OVERDUE_TABLE_STATE);
  const deferredState = useDeferredValue(state);
  const isStale = deferredState !== state;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overdue payments</CardTitle>
        <p className="text-muted-foreground text-sm">
          Every late or failed payment, newest billing month first. Mark one paid and the charts update with it.
        </p>
      </CardHeader>

      <CardPanel className="p-0 pt-0">
        <div className={cn("transition-opacity", isStale && "opacity-60")}>
          <Suspense fallback={<OverdueTableFallback />}>
            <OverdueTableRows
              state={deferredState}
              onPageChange={(page) => setState((previous) => ({ ...previous, page }))}
            />
          </Suspense>
        </div>
      </CardPanel>
    </Card>
  );
}
