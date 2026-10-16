"use client";

import { useState } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetCohortRetention } from "@/features/revenue/hooks";
import { COHORT_MAX_COLUMNS, COHORT_VISIBLE_COLUMNS, cohortAgeMonths, retentionShade } from "@/features/revenue/utils";
import { formatMonth, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * One retention cell: a heat-shaded percentage. Cohorts that haven't lived
 * long enough for a column show a quiet dot instead of a fake 0%.
 */
function RetentionCell({ pct, hasData }: { pct: number; hasData: boolean }): React.ReactElement {
  if (!hasData) {
    return (
      <div className="bg-muted/40 text-muted-foreground/40 flex h-9 min-w-14 items-center justify-center rounded-md text-xs select-none">
        ·
      </div>
    );
  }

  const shade = retentionShade(pct);

  return (
    <div className="relative flex h-9 min-w-14 items-center justify-center rounded-md">
      <span
        aria-hidden
        className="absolute inset-0 rounded-md bg-sky-600 dark:bg-sky-400"
        style={{ opacity: 0.06 + shade * 0.94 }}
      />
      <span
        className={cn("relative text-xs tabular-nums", shade >= 0.55 && "font-medium text-white dark:text-sky-950")}
      >
        {Math.round(pct)}%
      </span>
    </div>
  );
}

/**
 * Cohort retention by join month, heat-shaded so strong cohorts pop. The query
 * caps retention at 12 columns; the first seven render by default behind a
 * toggle so the matrix fits without horizontal noise.
 */
export function CohortRetentionCard(): React.ReactElement {
  const { data } = useGetCohortRetention();
  const [expanded, setExpanded] = useState(false);
  const columnCount = expanded ? COHORT_MAX_COLUMNS : COHORT_VISIBLE_COLUMNS;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Cohort retention</CardTitle>
            <p className="text-muted-foreground text-sm">
              Share of each join-month cohort still subscribed — darker is stickier.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setExpanded((previous) => !previous)}>
            {expanded ? <ChevronUp /> : <ChevronDown />}
            {expanded ? `Show first ${COHORT_VISIBLE_COLUMNS} months` : `Show ${COHORT_MAX_COLUMNS} months`}
          </Button>
        </div>
      </CardHeader>

      <CardPanel className="overflow-x-auto p-0 pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Cohort</TableHead>
              <TableHead className="text-right">Joined</TableHead>
              {Array.from({ length: columnCount }, (_, index) => (
                <TableHead key={index} className="text-center">
                  {`M${index}`}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((row) => {
              const ageMonths = cohortAgeMonths(row.cohortMonth);

              return (
                <TableRow key={row.cohortMonth}>
                  <TableCell className="pl-6 font-medium">{formatMonth(row.cohortMonth)}</TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
                    {formatNumber(row.size)}
                  </TableCell>
                  {Array.from({ length: columnCount }, (_, index) => (
                    <TableCell key={index} className="p-1">
                      <RetentionCell
                        pct={row.retention[index] ?? 0}
                        hasData={index <= ageMonths && index < row.retention.length}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <p className="text-muted-foreground px-6 pt-4 pb-6 text-xs">
          M0 is the join month; percentage is measured at each month-end. Blanks are months a cohort hasn&apos;t reached
          yet.
        </p>
      </CardPanel>
    </Card>
  );
}
