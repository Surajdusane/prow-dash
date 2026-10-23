"use client";

import { useMemo } from "react";

import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsComposedChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-composed-chart";
import type { HouseholdProfile } from "@/db/queries/customers";

/** Keep the sparkline honest - never plot more than the last month of points. */
const SPARKLINE_POINTS = 30;

const chartConfig = {
  tdsPpm: { label: "TDS (ppm)", colors: { light: ["#0284c7"], dark: ["#38bdf8"] } },
  purityPct: { label: "Purity (%)", colors: { light: ["#059669"], dark: ["#34d399"] } },
} satisfies ChartConfig;

const dayFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

// TDS (~200–500 ppm) and purity (~85–99%) live on very different scales, so each
// line gets its own auto-scaled axis. Both axes stay invisible - this is a
// sparkline, the tooltip carries the numbers.
const chartOptions = {
  yAxis: [
    { type: "value", show: false },
    { type: "value", show: false, position: "right" },
  ],
} as const;

/** Last-30-days TDS / purity mini chart for the household drawer. */
export function ReadingsSparkline({ readings }: { readings: HouseholdProfile["readings"] }) {
  const data = useMemo(
    () =>
      readings.slice(-SPARKLINE_POINTS).map((reading) => ({
        label: dayFormatter.format(reading.recordedAt),
        tdsPpm: reading.tdsPpm,
        purityPct: reading.purityPct,
      })),
    [readings]
  );

  return (
    <div className="flex h-full flex-col gap-3">
      <ChartLegend
        items={[
          { label: "TDS (ppm)", swatch: "bg-[#0284c7] dark:bg-[#38bdf8]" },
          { label: "Purity (%)", swatch: "bg-[#059669] dark:bg-[#34d399]" },
        ]}
        className="order-2"
      />

      <div className="h-32 w-full">
        <EChartsComposedChart
          data={data}
          config={chartConfig}
          xDataKey="label"
          curveType="linear"
          className="h-full w-full"
          chartOptions={chartOptions}
        >
          <EChartsComposedChart.Tooltip />
          <EChartsComposedChart.Line dataKey="tdsPpm" />
          <EChartsComposedChart.Line dataKey="purityPct" lineProps={{ yAxisIndex: 1 }} />
        </EChartsComposedChart>
      </div>
    </div>
  );
}
