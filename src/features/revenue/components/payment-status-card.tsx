"use client";

import { ChartEmpty } from "@/components/dashboard/chart-empty";
import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsBarChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-bar-chart";
import { useGetPaymentStatus } from "@/features/revenue/hooks";
import {
  PAYMENT_STATUS_COLOR_PAIRS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_ORDER,
  PAYMENT_STATUS_SWATCHES,
} from "@/features/revenue/utils";
import { chartColor } from "@/lib/chart-colors";
import { formatCompact, formatMonth, formatNumber } from "@/lib/format";

const chartConfig = {
  paid: { label: "Paid", colors: chartColor(PAYMENT_STATUS_COLOR_PAIRS.paid) },
  late: { label: "Late", colors: chartColor(PAYMENT_STATUS_COLOR_PAIRS.late) },
  failed: { label: "Failed", colors: chartColor(PAYMENT_STATUS_COLOR_PAIRS.failed) },
  pending: { label: "Pending", colors: chartColor(PAYMENT_STATUS_COLOR_PAIRS.pending) },
} satisfies ChartConfig;

/** Payment outcomes per billing month - semantic colours, stacked counts. */
export function PaymentStatusCard() {
  const { data } = useGetPaymentStatus();

  const chartData = data.map((point) => ({ ...point, label: formatMonth(point.month) }));
  const latest = data[data.length - 1];

  if (data.length === 0) {
    return (
      <ChartEmpty
        title="No payment history"
        description="Payment outcomes per billing month appear once billing runs."
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          ...PAYMENT_STATUS_ORDER.map((status) => ({
            label: PAYMENT_STATUS_LABELS[status],
            swatch: PAYMENT_STATUS_SWATCHES[status],
            value: latest ? formatNumber(latest[status]) : undefined,
          })),
          { label: latest ? `Latest month · ${formatMonth(latest.month)}` : "" },
        ]}
      />

      <div className="h-[280px] w-full">
        <EChartsBarChart
          data={chartData}
          config={chartConfig}
          xDataKey="label"
          className="h-full w-full"
          stackType="stacked"
          barRadius={2}
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.XAxis dataKey="label" hideDots />
          <EChartsBarChart.YAxis tickFormatter={(value) => formatCompact(Number(value))} />
          <EChartsBarChart.Tooltip />
          <EChartsBarChart.Bar dataKey="paid" />
          <EChartsBarChart.Bar dataKey="late" />
          <EChartsBarChart.Bar dataKey="failed" />
          <EChartsBarChart.Bar dataKey="pending" />
        </EChartsBarChart>
      </div>
    </div>
  );
}
