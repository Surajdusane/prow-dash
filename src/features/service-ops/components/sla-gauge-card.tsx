"use client";

import { useMemo } from "react";

import { ChartEmpty } from "@/components/dashboard/chart-empty";
import { EChartsRadialChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-radial-chart";
import { useGetSlaStats } from "@/features/service-ops/hooks";
import { formatNumber } from "@/lib/format";

function slaTone(pct: number): { light: string; dark: string } {
  if (pct >= 88) return { light: "#059669", dark: "#34d399" };
  if (pct >= 84) return { light: "#d97706", dark: "#fbbf24" };
  return { light: "#e11d48", dark: "#fb7185" };
}

export function SlaGaugeCard() {
  const { data } = useGetSlaStats();

  const tone = useMemo(() => slaTone(data.slaMetPct90d), [data.slaMetPct90d]);
  const chartConfig = useMemo(
    () =>
      ({
        slaMet: { label: "SLA met (90d)", colors: { light: [tone.light], dark: [tone.dark] } },
      }) satisfies ChartConfig,
    [tone]
  );
  const chartData = useMemo(() => [{ name: "slaMet", value: data.slaMetPct90d }], [data.slaMetPct90d]);

  if (data.open === 0 && data.slaMetPct90d === 0) {
    return (
      <ChartEmpty
        title="No SLA data yet"
        description="SLA performance is scored once tickets resolve within 90 days."
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="relative min-h-56 flex-1">
        <EChartsRadialChart
          data={chartData}
          config={chartConfig}
          nameKey="name"
          variant="semi"
          max={100}
          className="h-full w-full"
        >
          <EChartsRadialChart.RadialBar dataKey="value" barSize={20} cornerRadius={10} showBackground />
        </EChartsRadialChart>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-14">
          <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{data.slaMetPct90d}%</span>
          <span className="text-muted-foreground text-xs">SLA met · last 90 days</span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 border-t pt-4">
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground text-xs">Avg resolution</dt>
          <dd className="text-sm font-medium tabular-nums">{data.avgResolutionDays} days</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground text-xs">Open now</dt>
          <dd className="text-sm font-medium tabular-nums">{formatNumber(data.open)}</dd>
        </div>
      </dl>
    </div>
  );
}
