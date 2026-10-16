"use client";

import { useMemo } from "react";

import { CheckCircle2 } from "lucide-react";

import { ChartEmpty } from "@/components/dashboard/chart-empty";
import { EChartsPieChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-pie-chart";
import type { AnomalyRow } from "@/db/queries/devices";
import { useGetAnomalies } from "@/features/devices/hooks";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type AnomalyIssue = "offline" | "tds" | "purity";

const ISSUE_LABELS: Record<AnomalyIssue, string> = {
  offline: "Offline / silent",
  tds: "High TDS",
  purity: "Low purity",
};

const SWATCHES: Record<AnomalyIssue, string> = {
  offline: "bg-[#e11d48] dark:bg-[#fb7185]",
  tds: "bg-[#d97706] dark:bg-[#fbbf24]",
  purity: "bg-[#7c3aed] dark:bg-[#a78bfa]",
};

const chartConfig = {
  offline: { label: ISSUE_LABELS.offline, colors: { light: ["#e11d48"], dark: ["#fb7185"] } },
  tds: { label: ISSUE_LABELS.tds, colors: { light: ["#d97706"], dark: ["#fbbf24"] } },
  purity: { label: ISSUE_LABELS.purity, colors: { light: ["#7c3aed"], dark: ["#a78bfa"] } },
} satisfies ChartConfig;

const ISSUES = Object.keys(ISSUE_LABELS) as AnomalyIssue[];

/**
 * Primary issue for a flagged device — offline/silent first, then high TDS,
 * then low purity. Mirrors the flag priority the fleet query derives.
 */
function primaryIssue(anomaly: AnomalyRow): AnomalyIssue {
  if (!anomaly.isOnline || anomaly.lastReadingAt === null || (anomaly.staleDays !== null && anomaly.staleDays > 7)) {
    return "offline";
  }
  if (anomaly.latestTds !== null && anomaly.latestTds > 450) return "tds";
  return "purity";
}

/**
 * Donut of the anomaly feed bucketed by primary signal, with a readable legend.
 * Each device counts once — the same list the panel below renders.
 */
export function AnomalyMixCard() {
  const { data } = useGetAnomalies();

  const buckets = useMemo(() => {
    const counts: Record<AnomalyIssue, number> = { offline: 0, tds: 0, purity: 0 };
    for (const anomaly of data) {
      counts[primaryIssue(anomaly)] += 1;
    }

    const total = data.length;
    return ISSUES.map((issue) => ({
      issue,
      count: counts[issue],
      share: total === 0 ? 0 : Math.round((counts[issue] / total) * 100),
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <ChartEmpty
        icon={<CheckCircle2 />}
        title="No anomalies — fleet healthy"
        description="Connectivity and water quality are inside bounds."
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-5">
      <div className="relative aspect-square w-full max-w-52 shrink-0">
        <EChartsPieChart data={buckets} config={chartConfig} dataKey="count" nameKey="issue" className="h-full w-full">
          <EChartsPieChart.Tooltip />
          <EChartsPieChart.Pie
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={6}
            cornerRadius={12}
            startAngle={90}
            endAngle={-270}
          />
        </EChartsPieChart>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="border-border flex aspect-square w-[56%] flex-col items-center justify-center rounded-full border border-dashed">
            <span className="font-heading text-primary text-xl leading-none font-semibold tracking-tight tabular-nums">
              {formatNumber(data.length)}
            </span>
            <span className="text-muted-foreground mt-1 text-[10px] sm:text-xs">Flagged</span>
          </div>
        </div>
      </div>

      <ul className="flex w-full min-w-0 flex-col justify-center">
        {buckets.map((bucket) => (
          <li key={bucket.issue} className="flex items-center gap-2 py-1.5">
            <span aria-hidden className={cn("size-2.5 shrink-0 rounded-[3px]", SWATCHES[bucket.issue])} />
            <span className="text-muted-foreground truncate text-xs">{ISSUE_LABELS[bucket.issue]}</span>
            <span className="text-primary ml-auto text-xs font-semibold tabular-nums">
              {formatNumber(bucket.count)}
            </span>
            <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">{bucket.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
