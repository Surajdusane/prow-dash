"use client";

import { useMemo } from "react";

import { EChartsComposedChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-composed-chart";
import { tooltipIndicatorHtml, tooltipRow, tooltipShell } from "@/components/evilcharts/ui/echarts-tooltip";
import type { ReadingsResult } from "@/db/queries/devices";
import { TDS_PURITY_AXES } from "@/features/devices/utils";
import { formatDateKey, formatNumber } from "@/lib/format";

const chartConfig = {
  tdsPpm: { label: "TDS (ppm)", colors: { light: ["#0284c7"], dark: ["#38bdf8"] } },
  purityPct: { label: "Purity (%)", colors: { light: ["#059669"], dark: ["#34d399"] } },
} satisfies ChartConfig;

const dayFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

const MUTED_SWATCH = '<div class="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-muted-foreground/40"></div>';

type ReadingPoint = {
  label: string;
  timestamp: number;
  tdsPpm: number;
  purityPct: number;
};

/**
 * TDS + purity telemetry for one device. The filter-change reset is surfaced in
 * the tooltip (the chart library has no annotation API): hovering the first
 * reading on/after the last filter change gets an extra "Filter reset" row.
 */
export function ReadingsChart({
  readings,
  lastFilterChangeDate,
}: {
  readings: ReadingsResult["readings"];
  lastFilterChangeDate: string;
}) {
  const points = useMemo<ReadingPoint[]>(
    () =>
      readings.map((reading) => ({
        label: dayFormatter.format(reading.recordedAt),
        timestamp: reading.recordedAt.getTime(),
        tdsPpm: reading.tdsPpm,
        purityPct: reading.purityPct,
      })),
    [readings]
  );

  const resetIndex = useMemo(() => {
    const target = new Date(`${lastFilterChangeDate}T00:00:00`).getTime();
    return points.findIndex((point) => point.timestamp >= target);
  }, [points, lastFilterChangeDate]);

  // The stock tooltip only knows series values — swap in a formatter that adds
  // the filter-reset note for the reset reading.
  const chartOptions = useMemo(
    () => ({
      tooltip: {
        show: true,
        trigger: "axis" as const,
        confine: true,
        displayTransition: false,
        backgroundColor: "transparent",
        borderWidth: 0,
        padding: 0,
        extraCssText: "box-shadow:none;",
        axisPointer: { type: "none" as const },
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const first = list[0] as { dataIndex?: number } | undefined;
          const point = first?.dataIndex === undefined ? undefined : points[first.dataIndex];
          if (!point) return "";

          const body = [
            tooltipRow({
              indicatorHtml: tooltipIndicatorHtml("tdsPpm", 1),
              labelText: "TDS",
              valueText: `${formatNumber(point.tdsPpm)} ppm`,
              dimmed: "",
            }),
            tooltipRow({
              indicatorHtml: tooltipIndicatorHtml("purityPct", 1),
              labelText: "Purity",
              valueText: `${point.purityPct.toFixed(1)}%`,
              dimmed: "",
            }),
          ];
          if (first?.dataIndex === resetIndex) {
            body.push(
              tooltipRow({
                indicatorHtml: MUTED_SWATCH,
                labelText: "Filter reset",
                valueText: formatDateKey(lastFilterChangeDate),
                dimmed: "",
              })
            );
          }

          return tooltipShell({
            label: point.label,
            body: body.join(""),
            roundness: "lg",
            variant: "default",
          });
        },
      },
      yAxis: TDS_PURITY_AXES,
    }),
    [points, resetIndex, lastFilterChangeDate]
  );

  return (
    <EChartsComposedChart
      data={points}
      config={chartConfig}
      xDataKey="label"
      curveType="linear"
      className="h-full w-full"
      chartOptions={chartOptions}
    >
      <EChartsComposedChart.Grid />
      <EChartsComposedChart.XAxis dataKey="label" hideDots />
      <EChartsComposedChart.Tooltip />
      <EChartsComposedChart.Line dataKey="tdsPpm" />
      <EChartsComposedChart.Line dataKey="purityPct" lineProps={{ yAxisIndex: 1 }} />
    </EChartsComposedChart>
  );
}
