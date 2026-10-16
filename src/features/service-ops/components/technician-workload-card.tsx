"use client";

import { useMemo } from "react";

import { ChartEmpty } from "@/components/dashboard/chart-empty";
import { ChartLegend } from "@/components/dashboard/chart-legend";
import { EChartsBarChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-bar-chart";
import { useGetTechnicianWorkload } from "@/features/service-ops/hooks";
import { formatNumber } from "@/lib/format";

const chartConfig = {
  openTickets: { label: "Open now", colors: { light: ["#0284c7"], dark: ["#38bdf8"] } },
  resolved30d: { label: "Resolved (30d)", colors: { light: ["#059669"], dark: ["#34d399"] } },
} satisfies ChartConfig;

export function TechnicianWorkloadCard() {
  const { data } = useGetTechnicianWorkload();

  const chartData = useMemo(
    () => data.map((row) => ({ ...row, label: `${row.technicianName} · ${row.areaName}` })),
    [data]
  );

  if (data.length === 0) {
    return (
      <ChartEmpty
        title="No technician workload"
        description="Assign open tickets to technicians to see the load split."
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <ChartLegend
        items={[
          { label: "Open now", swatch: "bg-[#0284c7] dark:bg-[#38bdf8]" },
          { label: "Resolved (30d)", swatch: "bg-[#059669] dark:bg-[#34d399]" },
          { label: "Ranked by open load" },
        ]}
      />

      <div className="h-[420px] w-full">
        <EChartsBarChart
          data={chartData}
          config={chartConfig}
          xDataKey="label"
          layout="horizontal"
          className="h-full w-full"
        >
          <EChartsBarChart.Grid />
          <EChartsBarChart.YAxis dataKey="label" hideDots />
          <EChartsBarChart.XAxis tickFormatter={(value) => formatNumber(Number(value))} />
          <EChartsBarChart.Tooltip />
          <EChartsBarChart.Bar dataKey="openTickets" radius={4} />
          <EChartsBarChart.Bar dataKey="resolved30d" radius={4} />
        </EChartsBarChart>
      </div>
    </div>
  );
}
