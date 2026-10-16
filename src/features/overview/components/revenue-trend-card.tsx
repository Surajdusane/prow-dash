"use client";

import { ChartEmpty } from "@/components/dashboard/chart-empty";
import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart";
import { useGetRevenueTrend } from "@/features/overview/hooks";
import { formatInrCompact, formatMonth } from "@/lib/format";

const chartConfig = {
  billed: { label: "Billed", colors: { light: ["#0284c7"], dark: ["#38bdf8"] } },
  collected: { label: "Collected", colors: { light: ["#059669"], dark: ["#34d399"] } },
} satisfies ChartConfig;

export function RevenueTrendCard() {
  const { data } = useGetRevenueTrend();

  const chartData = data.map((point) => ({ ...point, label: formatMonth(point.month) }));
  const latest = data[data.length - 1];

  if (data.length === 0) {
    return (
      <ChartEmpty
        title="No billing history yet"
        description="The billed vs collected trend appears once payments are recorded."
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          {
            label: "Billed",
            swatch: "bg-[#0284c7] dark:bg-[#38bdf8]",
            value: latest ? formatInrCompact(latest.billed) : undefined,
          },
          {
            label: "Collected",
            swatch: "bg-[#059669] dark:bg-[#34d399]",
            value: latest ? formatInrCompact(latest.collected) : undefined,
          },
          { label: latest ? `Latest month · ${formatMonth(latest.month)}` : "" },
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
          <EChartsAreaChart.Area dataKey="billed" variant="gradient" strokeVariant="solid" />
          <EChartsAreaChart.Area dataKey="collected" variant="gradient" strokeVariant="solid" />
        </EChartsAreaChart>
      </div>
    </div>
  );
}
