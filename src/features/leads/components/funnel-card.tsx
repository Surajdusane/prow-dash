"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";

import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsBarChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-bar-chart";
import { tooltipRow, tooltipShell } from "@/components/evilcharts/ui/echarts-tooltip";
import { useGetFunnel } from "@/features/leads/hooks";
import {
  FUNNEL_STAGE_COLOR_PAIRS,
  FUNNEL_STAGE_LABELS,
  FUNNEL_STAGE_ORDER,
  FUNNEL_STAGE_SWATCHES,
} from "@/features/leads/utils";
import { formatCompact, formatNumber } from "@/lib/format";

const chartConfig = {
  count: { label: "Leads", colors: { light: ["#0284c7"], dark: ["#38bdf8"] } },
} satisfies ChartConfig;

/** Tooltip indicator painted with a literal hex — canvas/HTML overrides can't use CSS vars. */
function indicatorHtml(color: string): string {
  return `<div class="h-2.5 w-2.5 shrink-0 rounded-[2px]" style="background:${color}"></div>`;
}

/**
 * Leads → visits → converted as one horizontal bar each, with %-of-leads
 * labels. A single custom series replaces the built ones so every bar can
 * carry its own stage colour and value label — the stock bar series supports
 * neither, and ECharts can't resolve CSS variables inside canvas overrides,
 * so the hexes are picked per theme here.
 */
export function FunnelCard() {
  const { data } = useGetFunnel();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const rows = useMemo(() => {
    return FUNNEL_STAGE_ORDER.map((stage) => {
      const stageData = data.find((entry) => entry.stage === stage);
      return {
        stage,
        count: stageData?.count ?? 0,
        pctOfLeads: stageData?.pctOfLeads ?? 0,
        color: isDark ? FUNNEL_STAGE_COLOR_PAIRS[stage].dark : FUNNEL_STAGE_COLOR_PAIRS[stage].light,
      };
    });
  }, [data, isDark]);

  const chartData = useMemo(
    () => rows.map((row) => ({ label: FUNNEL_STAGE_LABELS[row.stage], count: row.count })),
    [rows]
  );

  const chartOptions = useMemo(() => {
    const labelColor = isDark ? "#d4d4d8" : "#52525b";

    return {
      // Widen the right inset so the "count · % of leads" labels never clip.
      grid: { left: 8, right: 152, top: 16, bottom: 8 },
      series: [
        {
          type: "bar",
          id: "funnel",
          barWidth: "52%",
          data: rows.map((row) => ({
            value: row.count,
            itemStyle: { color: row.color, borderRadius: [4, 4, 4, 4] },
          })),
          label: {
            show: true,
            position: "right",
            distance: 8,
            fontSize: 11,
            color: labelColor,
            formatter: (params: { dataIndex: number }) => {
              const row = rows[params.dataIndex];
              return row ? `${formatNumber(row.count)} · ${row.pctOfLeads}% of leads` : "";
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

          return tooltipShell({
            label: FUNNEL_STAGE_LABELS[row.stage],
            body: [
              tooltipRow({
                indicatorHtml: indicatorHtml(row.color),
                labelText: "Leads",
                valueText: formatNumber(row.count),
                dimmed: "",
              }),
              tooltipRow({
                indicatorHtml: indicatorHtml(row.color),
                labelText: "Share of leads",
                valueText: `${row.pctOfLeads}%`,
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

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          ...rows.map((row) => ({
            label: FUNNEL_STAGE_LABELS[row.stage],
            swatch: FUNNEL_STAGE_SWATCHES[row.stage],
            value: formatNumber(row.count),
          })),
          { label: "All-time pipeline" },
        ]}
      />

      <div className="h-[240px] w-full">
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
          <EChartsBarChart.XAxis tickFormatter={(value) => formatCompact(Number(value))} />
          <EChartsBarChart.Tooltip />
          <EChartsBarChart.Bar dataKey="count" />
        </EChartsBarChart>
      </div>
    </div>
  );
}
