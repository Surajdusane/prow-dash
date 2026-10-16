"use client";

import { useMemo } from "react";

import { ChartEmpty } from "@/components/dashboard/chart-empty";
import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsBarChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-bar-chart";
import { tooltipIndicatorHtml, tooltipRow, tooltipShell } from "@/components/evilcharts/ui/echarts-tooltip";
import { useGetAreaDemand } from "@/features/service-ops/hooks";
import { formatCompact, formatNumber } from "@/lib/format";

const chartConfig = {
  tickets90d: { label: "Tickets (90d)", colors: { light: ["#0284c7"], dark: ["#38bdf8"] } },
  per100Households: { label: "Per 100 households", colors: { light: ["#7c3aed"], dark: ["#a78bfa"] } },
} satisfies ChartConfig;

const MUTED_SWATCH = '<div class="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-muted-foreground/40"></div>';

export function AreaDemandCard() {
  const { data } = useGetAreaDemand();

  const chartData = useMemo(() => data.map((row) => ({ ...row, label: row.area })), [data]);
  const totalTickets = useMemo(() => data.reduce((sum, row) => sum + row.tickets90d, 0), [data]);

  // The stock tooltip only knows series values — swap in a formatter that also
  // surfaces infrastructure age for the hovered area.
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
                indicatorHtml: tooltipIndicatorHtml("tickets90d", 1),
                labelText: "Tickets (90d)",
                valueText: formatNumber(row.tickets90d),
                dimmed: "",
              }),
              tooltipRow({
                indicatorHtml: tooltipIndicatorHtml("per100Households", 1),
                labelText: "Per 100 households",
                valueText: formatNumber(row.per100Households),
                dimmed: "",
              }),
              tooltipRow({
                indicatorHtml: MUTED_SWATCH,
                labelText: "Infra age",
                valueText: `${row.infraAgeYears} yrs`,
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

  if (data.length === 0) {
    return (
      <ChartEmpty
        title="No ticket demand yet"
        description="Tickets raised in the last 90 days will appear here, per area."
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          { label: "Tickets raised", swatch: "bg-[#0284c7] dark:bg-[#38bdf8]", value: formatNumber(totalTickets) },
          { label: "Per 100 households", swatch: "bg-[#7c3aed] dark:bg-[#a78bfa]" },
          { label: "Last 90 days · hover for infra age" },
        ]}
      />

      <div className="h-[300px] w-full">
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
          <EChartsBarChart.Bar dataKey="tickets90d" variant="gradient" radius={4} />
          <EChartsBarChart.Bar dataKey="per100Households" radius={4} />
        </EChartsBarChart>
      </div>
    </div>
  );
}
