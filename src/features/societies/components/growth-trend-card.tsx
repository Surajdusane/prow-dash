"use client";

import { useMemo } from "react";

import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart";
import { useGetGrowthTrend } from "@/features/societies/hooks";
import { growthSeriesKeys } from "@/features/societies/utils";
import { categoryColorPair, categorySwatch, chartColor, OTHER_COLOR_PAIR, OTHER_SWATCH } from "@/lib/chart-colors";
import { formatCompact, formatMonth, formatNumber } from "@/lib/format";

/**
 * Cumulative active households per area, stacked. Series keys come from the
 * data (top eight areas plus "Other" — a fixed list would silently drop a new
 * area), and colours are assigned by rank so an area keeps its hue across
 * renders.
 */
export function GrowthTrendCard() {
  const { data } = useGetGrowthTrend();

  const seriesKeys = useMemo(() => growthSeriesKeys(data), [data]);

  const chartConfig = useMemo(() => {
    return Object.fromEntries(
      seriesKeys.map((key, index) => [
        key,
        {
          label: key,
          colors: chartColor(key === "Other" ? OTHER_COLOR_PAIR : categoryColorPair(index)),
        },
      ])
    ) satisfies ChartConfig;
  }, [seriesKeys]);

  const chartData = useMemo(() => data.map((point) => ({ ...point, label: formatMonth(point.month) })), [data]);
  const latest = data[data.length - 1];

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          ...seriesKeys.map((key, index) => ({
            label: key,
            swatch: key === "Other" ? OTHER_SWATCH : categorySwatch(index),
            value: latest ? formatNumber(Number(latest[key] ?? 0)) : undefined,
          })),
          { label: "Active households per month-end" },
        ]}
      />

      <div className="h-[320px] w-full">
        <EChartsAreaChart
          data={chartData}
          config={chartConfig}
          xDataKey="label"
          className="h-full w-full"
          stackType="stacked"
          curveType="monotone"
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="label" hideDots />
          <EChartsAreaChart.YAxis tickFormatter={(value) => formatCompact(Number(value))} />
          <EChartsAreaChart.Tooltip />
          {seriesKeys.map((key) => (
            <EChartsAreaChart.Area key={key} dataKey={key} strokeVariant="solid" />
          ))}
        </EChartsAreaChart>
      </div>
    </div>
  );
}
