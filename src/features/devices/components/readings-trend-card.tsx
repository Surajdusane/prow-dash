"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { ChartEmpty } from "@/components/dashboard/chart-empty";
import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsComposedChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-composed-chart";
import { useGetReadingsTrend } from "@/features/devices/hooks";
import { PURITY_SWATCH, TDS_PURITY_AXES, TDS_SWATCH } from "@/features/devices/utils";
import { formatDateKey } from "@/lib/format";
import { cn } from "@/lib/utils";

const chartConfig = {
  avgTds: { label: "Average TDS (ppm)", colors: { light: ["#0284c7"], dark: ["#38bdf8"] } },
  avgPurity: { label: "Average purity (%)", colors: { light: ["#059669"], dark: ["#34d399"] } },
} satisfies ChartConfig;

/** One telemetry point per day; the label is pre-formatted for the x-axis. */
function TrendChart({ days }: { days: 30 | 90 }) {
  const { data } = useGetReadingsTrend(days);

  const points = useMemo(
    () => data.map((point) => ({ label: formatDateKey(point.day), avgTds: point.avgTds, avgPurity: point.avgPurity })),
    [data]
  );

  if (points.length === 0) {
    return (
      <ChartEmpty
        title={`No telemetry in the last ${days} days`}
        description="Fleet averages appear as devices report in."
      />
    );
  }

  return (
    <EChartsComposedChart
      data={points}
      config={chartConfig}
      xDataKey="label"
      curveType="linear"
      className="h-full w-full"
      chartOptions={{ yAxis: TDS_PURITY_AXES }}
    >
      <EChartsComposedChart.Grid />
      <EChartsComposedChart.XAxis dataKey="label" hideDots />
      <EChartsComposedChart.Tooltip />
      <EChartsComposedChart.Line dataKey="avgTds" />
      <EChartsComposedChart.Line dataKey="avgPurity" lineProps={{ yAxisIndex: 1 }} />
    </EChartsComposedChart>
  );
}

/**
 * Fleet-wide daily TDS/purity averages with a 30/90-day window. The tabs read
 * the urgent value so the toggle lands instantly, while a deferred copy drives
 * the suspended chart so the current curve stays on screen (dimmed) until the
 * next window resolves.
 */
export function ReadingsTrendCard() {
  const [days, setDays] = useState<30 | 90>(30);
  const deferredDays = useDeferredValue(days);
  const isStale = deferredDays !== days;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ChartLegend
          items={[
            { label: "Average TDS (ppm)", swatch: TDS_SWATCH },
            { label: "Average purity (%)", swatch: PURITY_SWATCH },
          ]}
        />
        <Tabs value={String(days)} onValueChange={(value) => setDays(value === "90" ? 90 : 30)}>
          <TabsList>
            <TabsTab value="30">30 days</TabsTab>
            <TabsTab value="90">90 days</TabsTab>
          </TabsList>
        </Tabs>
      </div>

      <div className={cn("h-[280px] w-full transition-opacity", isStale && "opacity-60")}>
        <TrendChart days={deferredDays} />
      </div>
    </div>
  );
}
