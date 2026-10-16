"use client";

import { ChartEmpty } from "@/components/dashboard/chart-empty";
import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart";
import { useGetImpactMonthlyTrend } from "@/features/sustainability/hooks";
import { LITRES_COLOR_PAIR, LITRES_SWATCH } from "@/features/sustainability/utils";
import { chartColor } from "@/lib/chart-colors";
import { formatCompact, formatMonth, formatNumber } from "@/lib/format";

const chartConfig = {
  cumulativeLitres: { label: "Litres served", colors: chartColor(LITRES_COLOR_PAIR) },
} satisfies ChartConfig;

/** Cumulative litres served since the first subscription — estimated, not metered. */
export function LitresTrendCard() {
  const { data } = useGetImpactMonthlyTrend();

  const chartData = data.map((point) => ({ ...point, label: formatMonth(point.month) }));
  const latest = data[data.length - 1];

  if (data.length === 0) {
    return (
      <ChartEmpty
        title="No litres recorded yet"
        description="Estimated litres served appear once subscriptions are active."
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          {
            label: "Cumulative litres",
            swatch: LITRES_SWATCH,
            value: latest ? `${formatNumber(latest.cumulativeLitres)} L` : undefined,
          },
          { label: "Last 24 months" },
        ]}
      />

      <div className="h-[260px] w-full">
        <EChartsAreaChart
          data={chartData}
          config={chartConfig}
          xDataKey="label"
          className="h-full w-full"
          curveType="monotone"
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="label" hideDots />
          <EChartsAreaChart.YAxis tickFormatter={(value) => formatCompact(Number(value))} />
          <EChartsAreaChart.Tooltip />
          <EChartsAreaChart.Area dataKey="cumulativeLitres" variant="gradient" strokeVariant="solid" />
        </EChartsAreaChart>
      </div>
    </div>
  );
}
