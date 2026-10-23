"use client";

import { useMemo } from "react";

import { ChartEmpty } from "@/components/dashboard/chart-empty";
import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsBarChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-bar-chart";
import { tooltipIndicatorHtml, tooltipRow, tooltipShell } from "@/components/evilcharts/ui/echarts-tooltip";
import { useGetAreaPenetration } from "@/features/societies/hooks";
import { formatNumber } from "@/lib/format";

const chartConfig = {
  penetrationPct: { label: "Penetration", colors: { light: ["#0284c7"], dark: ["#38bdf8"] } },
} satisfies ChartConfig;

const MUTED_SWATCH = '<div class="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-muted-foreground/40"></div>';

/**
 * Household penetration per area, highest first. The stock tooltip only knows
 * the bar value - a custom formatter also surfaces infrastructure age and
 * ticket intensity, the two numbers that explain why an area lags.
 */
export function AreaPenetrationCard() {
  const { data } = useGetAreaPenetration();

  // The query already sorts by penetration; re-sort defensively so the chart
  // and its "top area" legend never disagree with the data.
  const rows = useMemo(() => [...data].sort((a, b) => b.penetrationPct - a.penetrationPct), [data]);
  const chartData = useMemo(() => rows.map((row) => ({ ...row, label: row.area })), [rows]);
  const top = rows[0];

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
          const row = first?.dataIndex === undefined ? undefined : chartData[first.dataIndex];
          if (!row) return "";

          return tooltipShell({
            label: row.area,
            body: [
              tooltipRow({
                indicatorHtml: tooltipIndicatorHtml("penetrationPct", 1),
                labelText: "Penetration",
                valueText: `${row.penetrationPct}%`,
                dimmed: "",
              }),
              tooltipRow({
                indicatorHtml: MUTED_SWATCH,
                labelText: "Households / flats",
                valueText: `${formatNumber(row.households)} / ${formatNumber(row.totalFlats)}`,
                dimmed: "",
              }),
              tooltipRow({
                indicatorHtml: MUTED_SWATCH,
                labelText: "Infrastructure age",
                valueText: `${row.infraAgeYears} yrs`,
                dimmed: "",
              }),
              tooltipRow({
                indicatorHtml: MUTED_SWATCH,
                labelText: "Tickets per 100 households",
                valueText: formatNumber(row.ticketsPer100),
                dimmed: "",
              }),
            ].join(""),
            roundness: "lg",
            variant: "default",
          });
        },
      },
    }),
    [chartData]
  );

  if (rows.length === 0) {
    return (
      <ChartEmpty
        title="No societies to measure"
        description="Penetration appears once societies onboard households."
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          {
            label: "Active households ÷ flats covered",
            swatch: "bg-[#0284c7] dark:bg-[#38bdf8]",
            value: top ? `${top.area} leads at ${top.penetrationPct}%` : undefined,
          },
          { label: "Last 90 days · hover a bar for infra age and tickets" },
        ]}
      />

      <div className="h-[340px] w-full">
        <EChartsBarChart
          data={chartData}
          config={chartConfig}
          xDataKey="label"
          className="h-full w-full"
          layout="horizontal"
          chartOptions={chartOptions}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.YAxis dataKey="label" hideDots />
          <EChartsBarChart.XAxis tickFormatter={(value) => `${Math.round(Number(value))}%`} />
          <EChartsBarChart.Tooltip />
          <EChartsBarChart.Bar dataKey="penetrationPct" radius={4} />
        </EChartsBarChart>
      </div>
    </div>
  );
}
