"use client";

import { useMemo } from "react";

import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsLineChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-line-chart";
import { useGetComplaintTrend } from "@/features/customers/hooks";
import { COMPLAINT_CATEGORIES, COMPLAINT_CATEGORY_LABELS } from "@/features/customers/utils";
import { formatMonth, formatNumber } from "@/lib/format";

const COMPLAINT_TREND_CONFIG = {
  water_quality: { label: "Water quality", colors: { light: ["#0284c7"], dark: ["#38bdf8"] } },
  service_delay: { label: "Service delay", colors: { light: ["#7c3aed"], dark: ["#a78bfa"] } },
  billing: { label: "Billing", colors: { light: ["#d97706"], dark: ["#fbbf24"] } },
  device_malfunction: { label: "Device malfunction", colors: { light: ["#e11d48"], dark: ["#fb7185"] } },
  other: { label: "Other", colors: { light: ["#059669"], dark: ["#34d399"] } },
} satisfies ChartConfig;

const SWATCHES: Record<(typeof COMPLAINT_CATEGORIES)[number], string> = {
  water_quality: "bg-[#0284c7] dark:bg-[#38bdf8]",
  service_delay: "bg-[#7c3aed] dark:bg-[#a78bfa]",
  billing: "bg-[#d97706] dark:bg-[#fbbf24]",
  device_malfunction: "bg-[#e11d48] dark:bg-[#fb7185]",
  other: "bg-[#059669] dark:bg-[#34d399]",
};

/** Monthly complaint volume per category — one line per category, 12 months. */
export function ComplaintTrendCard() {
  const { data } = useGetComplaintTrend();

  const chartData = useMemo(() => data.map((point) => ({ ...point, label: formatMonth(point.month) })), [data]);
  const last12 = useMemo(
    () =>
      data.reduce(
        (sum, point) => sum + COMPLAINT_CATEGORIES.reduce((monthSum, category) => monthSum + point[category], 0),
        0
      ),
    [data]
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          ...COMPLAINT_CATEGORIES.map((category) => ({
            label: COMPLAINT_CATEGORY_LABELS[category],
            swatch: SWATCHES[category],
          })),
          { label: "Last 12 months", value: formatNumber(last12) },
        ]}
      />

      <div className="h-[300px] w-full">
        <EChartsLineChart data={chartData} config={COMPLAINT_TREND_CONFIG} xDataKey="label" className="h-full w-full">
          <EChartsLineChart.Grid />
          <EChartsLineChart.XAxis dataKey="label" hideDots />
          <EChartsLineChart.YAxis tickFormatter={(value) => formatNumber(value)} />
          <EChartsLineChart.Tooltip />
          {COMPLAINT_CATEGORIES.map((category) => (
            <EChartsLineChart.Line key={category} dataKey={category} />
          ))}
        </EChartsLineChart>
      </div>
    </div>
  );
}
