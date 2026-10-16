"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";

import { ChartEmpty } from "@/components/dashboard/chart-empty";
import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsBarChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-bar-chart";
import { tooltipRow, tooltipShell } from "@/components/evilcharts/ui/echarts-tooltip";
import { useGetImpactByPlan } from "@/features/sustainability/hooks";
import { LITRES_COLOR_PAIR, PLAN_LABELS, PLAN_ORDER } from "@/features/sustainability/utils";
import { chartColor, PLAN_COLOR_PAIRS, PLAN_SWATCHES } from "@/lib/chart-colors";
import { formatCompact, formatNumber } from "@/lib/format";

const chartConfig = {
  litres: { label: "Litres served", colors: chartColor(LITRES_COLOR_PAIR) },
} satisfies ChartConfig;

/** Tooltip indicator painted with a literal hex — overrides can't use CSS vars. */
function indicatorHtml(color: string): string {
  return `<div class="h-2.5 w-2.5 shrink-0 rounded-[2px]" style="background:${color}"></div>`;
}

/**
 * All-time litres served per plan, each bar labelled with its jar equivalent.
 * One custom series replaces the built ones so every bar can carry its plan
 * colour and a jars label — the stock bar series supports neither, so the
 * hexes are picked per theme here.
 */
export function ByPlanCard() {
  const { data } = useGetImpactByPlan();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const rows = useMemo(() => PLAN_ORDER.flatMap((plan) => data.filter((row) => row.plan === plan)), [data]);
  const chartData = useMemo(() => rows.map((row) => ({ label: PLAN_LABELS[row.plan], litres: row.litres })), [rows]);

  const chartOptions = useMemo(() => {
    const labelColor = isDark ? "#d4d4d8" : "#52525b";

    return {
      // Headroom above the tallest bar so its jars label never clips.
      grid: { left: 8, right: 8, top: 34, bottom: 8 },
      series: [
        {
          type: "bar",
          id: "byPlan",
          barWidth: "46%",
          data: rows.map((row) => ({
            value: row.litres,
            itemStyle: {
              color: isDark ? PLAN_COLOR_PAIRS[row.plan].dark : PLAN_COLOR_PAIRS[row.plan].light,
              borderRadius: [4, 4, 4, 4],
            },
          })),
          label: {
            show: true,
            position: "top",
            distance: 8,
            fontSize: 11,
            color: labelColor,
            formatter: (params: { dataIndex: number }) => {
              const row = rows[params.dataIndex];
              return row ? `${formatNumber(row.jarsAvoided)} 20 L jars` : "";
            },
          },
        },
      ],
      tooltip: {
        show: true,
        trigger: "item" as const,
        confine: true,
        displayTransition: false,
        backgroundColor: "transparent",
        borderWidth: 0,
        padding: 0,
        extraCssText: "box-shadow:none;",
        axisPointer: { type: "none" as const },
        formatter: (params: unknown) => {
          const item = Array.isArray(params) ? params[0] : params;
          const dataIndex = (item as { dataIndex?: number } | undefined)?.dataIndex;
          const row = dataIndex === undefined ? undefined : rows[dataIndex];
          if (!row) return "";

          const color = isDark ? PLAN_COLOR_PAIRS[row.plan].dark : PLAN_COLOR_PAIRS[row.plan].light;

          return tooltipShell({
            label: PLAN_LABELS[row.plan],
            body: [
              tooltipRow({
                indicatorHtml: indicatorHtml(color),
                labelText: "Litres served",
                valueText: `${formatNumber(row.litres)} L`,
                dimmed: "",
              }),
              tooltipRow({
                indicatorHtml: indicatorHtml(color),
                labelText: "20 L jars avoided",
                valueText: formatNumber(row.jarsAvoided),
                dimmed: "",
              }),
            ].join(""),
            roundness: "lg",
            variant: "default",
          });
        },
      },
    };
  }, [rows, isDark]);

  if (rows.length === 0) {
    return (
      <ChartEmpty title="No impact by plan" description="All-time litres served appear once subscriptions go live." />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          ...rows.map((row) => ({
            label: PLAN_LABELS[row.plan],
            swatch: PLAN_SWATCHES[row.plan],
            value: `${formatCompact(row.litres)} L`,
          })),
          { label: "Labels show jars avoided" },
        ]}
      />

      <div className="h-[280px] w-full">
        <EChartsBarChart
          data={chartData}
          config={chartConfig}
          xDataKey="label"
          className="h-full w-full"
          chartOptions={chartOptions}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis dataKey="label" hideDots />
          <EChartsBarChart.YAxis tickFormatter={(value) => formatCompact(Number(value))} />
          <EChartsBarChart.Tooltip />
          <EChartsBarChart.Bar dataKey="litres" />
        </EChartsBarChart>
      </div>
    </div>
  );
}
