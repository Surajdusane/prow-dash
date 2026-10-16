"use client";

import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsBarChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-bar-chart";
import { useGetPlanMixTrend } from "@/features/revenue/hooks";
import { PLAN_COLOR_PAIRS, PLAN_LABELS, PLAN_SWATCHES } from "@/features/revenue/utils";
import { chartColor } from "@/lib/chart-colors";
import { formatCompact, formatMonth, formatNumber } from "@/lib/format";

const chartConfig = {
  starter: { label: "Starter", colors: chartColor(PLAN_COLOR_PAIRS.starter) },
  standard: { label: "Standard", colors: chartColor(PLAN_COLOR_PAIRS.standard) },
  premium: { label: "Premium", colors: chartColor(PLAN_COLOR_PAIRS.premium) },
} satisfies ChartConfig;

/** Active subscriptions per plan at each month-end — the mix growth story. */
export function PlanMixTrendCard() {
  const { data } = useGetPlanMixTrend();

  const chartData = data.map((point) => ({ ...point, label: formatMonth(point.month) }));
  const latest = data[data.length - 1];

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          {
            label: PLAN_LABELS.starter,
            swatch: PLAN_SWATCHES.starter,
            value: latest ? formatNumber(latest.starter) : undefined,
          },
          {
            label: PLAN_LABELS.standard,
            swatch: PLAN_SWATCHES.standard,
            value: latest ? formatNumber(latest.standard) : undefined,
          },
          {
            label: PLAN_LABELS.premium,
            swatch: PLAN_SWATCHES.premium,
            value: latest ? formatNumber(latest.premium) : undefined,
          },
          { label: "Active subscriptions per month-end" },
        ]}
      />

      <div className="h-[280px] w-full">
        <EChartsBarChart
          data={chartData}
          config={chartConfig}
          xDataKey="label"
          className="h-full w-full"
          stackType="stacked"
          barRadius={2}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis dataKey="label" hideDots />
          <EChartsBarChart.YAxis tickFormatter={(value) => formatCompact(Number(value))} />
          <EChartsBarChart.Tooltip />
          <EChartsBarChart.Bar dataKey="starter" />
          <EChartsBarChart.Bar dataKey="standard" />
          <EChartsBarChart.Bar dataKey="premium" />
        </EChartsBarChart>
      </div>
    </div>
  );
}
