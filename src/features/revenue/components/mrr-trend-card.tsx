"use client";

import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart";
import { useGetMrrTrend } from "@/features/revenue/hooks";
import { formatInr, formatInrCompact, formatMonth } from "@/lib/format";

const chartConfig = {
  mrr: { label: "MRR", colors: { light: ["#059669"], dark: ["#34d399"] } },
} satisfies ChartConfig;

/** Month-end MRR over the last 18 months, reconstructed from subscription spans. */
export function MrrTrendCard() {
  const { data } = useGetMrrTrend();

  const chartData = data.map((point) => ({ ...point, label: formatMonth(point.month) }));
  const latest = data[data.length - 1];
  const first = data[0];
  const growth = first && first.mrr > 0 && latest ? Math.round(((latest.mrr - first.mrr) / first.mrr) * 100) : null;

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          { label: "MRR", swatch: "bg-[#059669] dark:bg-[#34d399]", value: latest ? formatInr(latest.mrr) : undefined },
          { label: growth === null ? "Last 18 months" : `${growth >= 0 ? "+" : ""}${growth}% vs 18 months ago` },
        ]}
      />

      <div className="h-[280px] w-full">
        <EChartsAreaChart
          data={chartData}
          config={chartConfig}
          xDataKey="label"
          className="h-full w-full"
          curveType="monotone"
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="label" hideDots />
          <EChartsAreaChart.YAxis tickFormatter={(value) => formatInrCompact(value)} />
          <EChartsAreaChart.Tooltip />
          <EChartsAreaChart.Area dataKey="mrr" variant="gradient" strokeVariant="solid" />
        </EChartsAreaChart>
      </div>
    </div>
  );
}
