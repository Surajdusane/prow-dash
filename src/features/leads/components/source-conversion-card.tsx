"use client";

import { useMemo } from "react";

import { ChartEmpty } from "@/components/dashboard/chart-empty";
import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsBarChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-bar-chart";
import { tooltipIndicatorHtml, tooltipRow, tooltipShell } from "@/components/evilcharts/ui/echarts-tooltip";
import { useGetLeadsBySource } from "@/features/leads/hooks";
import { FUNNEL_STAGE_COLOR_PAIRS, FUNNEL_STAGE_SWATCHES, leadSourceLabel } from "@/features/leads/utils";
import { chartColor } from "@/lib/chart-colors";
import { formatCompact, formatNumber } from "@/lib/format";

const chartConfig = {
  leads: { label: "Leads", colors: chartColor(FUNNEL_STAGE_COLOR_PAIRS.leads) },
  visits: { label: "Visits", colors: chartColor(FUNNEL_STAGE_COLOR_PAIRS.visits) },
  converted: { label: "Converted", colors: chartColor(FUNNEL_STAGE_COLOR_PAIRS.converted) },
} satisfies ChartConfig;

/**
 * Each channel's pipeline side by side - leads, visits and conversions as
 * grouped bars. The stock tooltip only knows the three counts; a custom
 * formatter also surfaces the channel's conversion rate.
 */
export function SourceConversionCard() {
  const { data } = useGetLeadsBySource();

  const chartData = useMemo(() => data.map((row) => ({ ...row, label: leadSourceLabel(row.source) })), [data]);
  const totalLeads = useMemo(() => data.reduce((sum, row) => sum + row.leads, 0), [data]);

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
            label: leadSourceLabel(row.source),
            body: [
              tooltipRow({
                indicatorHtml: tooltipIndicatorHtml("leads", 1),
                labelText: "Leads",
                valueText: formatNumber(row.leads),
                dimmed: "",
              }),
              tooltipRow({
                indicatorHtml: tooltipIndicatorHtml("visits", 1),
                labelText: "Visits",
                valueText: formatNumber(row.visits),
                dimmed: "",
              }),
              tooltipRow({
                indicatorHtml: tooltipIndicatorHtml("converted", 1),
                labelText: "Converted",
                valueText: formatNumber(row.converted),
                dimmed: "",
              }),
              tooltipRow({
                indicatorHtml: tooltipIndicatorHtml("converted", 1),
                labelText: "Conversion rate",
                valueText: `${row.conversionRate}%`,
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
    return <ChartEmpty title="No leads by source" description="Channel performance appears once leads are captured." />;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          { label: "Leads", swatch: FUNNEL_STAGE_SWATCHES.leads, value: formatNumber(totalLeads) },
          { label: "Visits", swatch: FUNNEL_STAGE_SWATCHES.visits },
          { label: "Converted", swatch: FUNNEL_STAGE_SWATCHES.converted },
          { label: "Hover for conversion rate" },
        ]}
      />

      <div className="h-[240px] w-full">
        <EChartsBarChart
          data={chartData}
          config={chartConfig}
          xDataKey="label"
          className="h-full w-full"
          chartOptions={chartOptions}
          barRadius={3}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis dataKey="label" hideDots />
          <EChartsBarChart.YAxis tickFormatter={(value) => formatCompact(Number(value))} />
          <EChartsBarChart.Tooltip />
          <EChartsBarChart.Bar dataKey="leads" />
          <EChartsBarChart.Bar dataKey="visits" />
          <EChartsBarChart.Bar dataKey="converted" />
        </EChartsBarChart>
      </div>
    </div>
  );
}
