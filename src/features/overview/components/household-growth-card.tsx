"use client";

import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsAreaChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-area-chart";
import { useGetHouseholdGrowth } from "@/features/overview/hooks";
import { formatCompact, formatMonth, formatNumber } from "@/lib/format";

const chartConfig = {
  active: { label: "Active", colors: { light: ["#059669"], dark: ["#34d399"] } },
  cancelled: { label: "Cancelled", colors: { light: ["#e11d48"], dark: ["#fb7185"] } },
} satisfies ChartConfig;

export function HouseholdGrowthCard() {
  const { data } = useGetHouseholdGrowth();

  const chartData = data.map((point) => ({ ...point, label: formatMonth(point.month) }));
  const latest = data[data.length - 1];

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          {
            label: "Active",
            swatch: "bg-[#059669] dark:bg-[#34d399]",
            value: latest ? formatNumber(latest.active) : undefined,
          },
          {
            label: "Cancelled (cumulative)",
            swatch: "bg-[#e11d48] dark:bg-[#fb7185]",
            value: latest ? formatNumber(latest.cancelled) : undefined,
          },
        ]}
      />

      <div className="h-[280px] w-full">
        <EChartsAreaChart
          data={chartData}
          config={chartConfig}
          xDataKey="label"
          className="h-full w-full"
          curveType="monotone"
          stackType="stacked"
        >
          <EChartsAreaChart.Grid />
          <EChartsAreaChart.XAxis dataKey="label" hideDots />
          <EChartsAreaChart.YAxis tickFormatter={(value) => formatCompact(value)} />
          <EChartsAreaChart.Tooltip />
          <EChartsAreaChart.Area dataKey="active" variant="gradient" strokeVariant="solid" />
          <EChartsAreaChart.Area dataKey="cancelled" variant="gradient" strokeVariant="solid" />
        </EChartsAreaChart>
      </div>
    </div>
  );
}
