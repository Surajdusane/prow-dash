"use client";

import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart";
import { useGetImpactMonthlyTrend } from "@/features/sustainability/hooks";
import { JARS_COLOR_PAIR, JARS_SWATCH } from "@/features/sustainability/utils";
import { chartColor } from "@/lib/chart-colors";
import { formatCompact, formatMonth, formatNumber } from "@/lib/format";

const chartConfig = {
  cumulativeJarsAvoided: { label: "Jars avoided", colors: chartColor(JARS_COLOR_PAIR) },
} satisfies ChartConfig;

/** Cumulative 20 L jars avoided — the same litres story told in plastic. */
export function JarsTrendCard() {
  const { data } = useGetImpactMonthlyTrend();

  const chartData = data.map((point) => ({ ...point, label: formatMonth(point.month) }));
  const latest = data[data.length - 1];

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          {
            label: "Cumulative jars avoided",
            swatch: JARS_SWATCH,
            value: latest ? formatNumber(latest.cumulativeJarsAvoided) : undefined,
          },
          { label: "1 jar = 20 L" },
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
          <EChartsAreaChart.Area dataKey="cumulativeJarsAvoided" variant="gradient" strokeVariant="solid" />
        </EChartsAreaChart>
      </div>
    </div>
  );
}
