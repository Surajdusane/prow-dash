"use client";

import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableEmpty } from "@/components/dashboard/table-empty";
import { useGetAreaHealth } from "@/features/overview/hooks";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

function slaTone(slaPct: number | null): string {
  if (slaPct === null) return "bg-muted-foreground/40";
  if (slaPct >= 88) return "bg-emerald-500 dark:bg-emerald-400";
  if (slaPct >= 84) return "bg-amber-500 dark:bg-amber-400";
  return "bg-rose-500 dark:bg-rose-400";
}

export function AreaHealthCard() {
  const { data } = useGetAreaHealth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Area health</CardTitle>
        <p className="text-muted-foreground text-sm">
          Active households, open workload, fleet water quality (TDS, 30d) and SLA performance (90d) per area.
        </p>
      </CardHeader>
      <CardPanel className="p-0 pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Area</TableHead>
              <TableHead className="text-right">Households</TableHead>
              <TableHead className="text-right">Open tickets</TableHead>
              <TableHead className="text-right">Avg TDS (30d)</TableHead>
              <TableHead className="min-w-44 pr-6">SLA met (90d)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableEmpty
                colSpan={5}
                title="No areas to show"
                description="Area health appears once households are active."
              />
            ) : (
              data.map((row) => (
                <TableRow key={row.areaId}>
                  <TableCell className="pl-6 font-medium">{row.area}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(row.households)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(row.openTickets)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.avgTds30d === null ? <span className="text-muted-foreground">—</span> : `${row.avgTds30d} ppm`}
                  </TableCell>
                  <TableCell className="pr-6">
                    {row.slaMetPct90d === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="w-10 text-right text-xs font-medium tabular-nums">{row.slaMetPct90d}%</span>
                        <Progress value={row.slaMetPct90d} className="w-full max-w-48">
                          <ProgressTrack className="h-1.5">
                            <ProgressIndicator className={cn(slaTone(row.slaMetPct90d))} />
                          </ProgressTrack>
                        </Progress>
                      </div>
                    )}
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
