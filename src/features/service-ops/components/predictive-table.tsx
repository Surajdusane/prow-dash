"use client";

import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableEmpty } from "@/components/dashboard/table-empty";
import { useGetPredictive } from "@/features/service-ops/hooks";
import { useServiceOpsUiStore } from "@/features/service-ops/store";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

function tdsTone(tds: number): string {
  if (tds >= 500) return "text-rose-600 dark:text-rose-400";
  if (tds >= 300) return "text-amber-600 dark:text-amber-400";
  return "text-foreground";
}

/**
 * Preventive queue: the households most likely to need a filter change next,
 * with a one-click way to raise the ticket before they call in.
 */
export function PredictiveTable() {
  const { data } = useGetPredictive();
  const openCreateTicket = useServiceOpsUiStore((state) => state.openCreateTicket);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predicted next service</CardTitle>
        <p className="text-muted-foreground text-sm">
          Dispensers trending toward a filter change - ranked by TDS slope and filter age. Raise the ticket before the
          household complains.
        </p>
      </CardHeader>
      <CardPanel className="p-0 pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Household</TableHead>
              <TableHead>Area</TableHead>
              <TableHead className="text-right">Filter age</TableHead>
              <TableHead className="text-right">Latest TDS</TableHead>
              <TableHead className="text-right">Trend</TableHead>
              <TableHead className="max-w-72">Signal</TableHead>
              <TableHead className="pr-6 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableEmpty
                colSpan={7}
                icon={<CheckCircle2 />}
                title="No predicted services"
                description="Dispensers trending toward a filter change will surface here."
              />
            ) : (
              data.map((row) => (
                <TableRow key={row.dispenserId}>
                  <TableCell className="pl-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        {row.flatNumber} · {row.societyName}
                      </span>
                      <span className="text-muted-foreground text-xs">{row.residentName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.areaName}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.filterAgeDays >= 70 ? (
                      <Badge variant="warning" size="sm">
                        {row.filterAgeDays} days
                      </Badge>
                    ) : (
                      `${row.filterAgeDays} days`
                    )}
                  </TableCell>
                  <TableCell className={cn("text-right font-medium tabular-nums", tdsTone(row.latestTds))}>
                    {formatNumber(row.latestTds)} ppm
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        row.tdsSlope7d > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {row.tdsSlope7d > 0 ? "+" : ""}
                      {row.tdsSlope7d}%/wk
                    </span>
                  </TableCell>
                  <TableCell className="max-w-72">
                    <span className="text-muted-foreground block truncate text-xs" title={row.reason}>
                      {row.reason}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button size="sm" variant="outline" onClick={() => openCreateTicket(row.householdId)}>
                      Create ticket
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardPanel>
    </Card>
  );
}
