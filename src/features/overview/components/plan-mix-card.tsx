"use client";

import { EChartsPieChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-pie-chart";
import { useGetPlanMix } from "@/features/overview/hooks";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  standard: "Standard",
  premium: "Premium",
};

const PLAN_SWATCHES: Record<string, string> = {
  starter: "bg-[#d97706] dark:bg-[#fbbf24]",
  standard: "bg-[#0284c7] dark:bg-[#38bdf8]",
  premium: "bg-[#7c3aed] dark:bg-[#a78bfa]",
};

const chartConfig = {
  starter: { label: "Starter", colors: { light: ["#d97706"], dark: ["#fbbf24"] } },
  standard: { label: "Standard", colors: { light: ["#0284c7"], dark: ["#38bdf8"] } },
  premium: { label: "Premium", colors: { light: ["#7c3aed"], dark: ["#a78bfa"] } },
} satisfies ChartConfig;

export function PlanMixCard() {
  const { data } = useGetPlanMix();

  const total = data.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <div className="flex h-full flex-col items-center gap-4 p-2 sm:flex-row sm:gap-6">
      <div className="relative aspect-square w-full max-w-56 shrink-0 sm:w-[46%]">
        <EChartsPieChart data={data} config={chartConfig} dataKey="count" nameKey="plan" className="h-full w-full">
          <EChartsPieChart.Tooltip />
          <EChartsPieChart.Pie
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={6}
            cornerRadius={12}
            startAngle={90}
            endAngle={-270}
          />
        </EChartsPieChart>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="border-border flex aspect-square w-[56%] flex-col items-center justify-center rounded-full border border-dashed">
            <span className="text-primary font-heading text-xl leading-none font-semibold tracking-tight tabular-nums">
              {formatNumber(total)}
            </span>
            <span className="text-muted-foreground mt-1 text-[10px] sm:text-xs">Active subs</span>
          </div>
        </div>
      </div>

      <ul className="flex min-h-0 w-full min-w-0 flex-1 flex-col justify-center">
        {data.map((slice) => (
          <li key={slice.plan} className="flex items-center gap-2 py-1.5 sm:py-2">
            <span aria-hidden className={cn("size-2.5 shrink-0 rounded-[3px]", PLAN_SWATCHES[slice.plan])} />
            <span className="text-muted-foreground truncate text-xs">{PLAN_LABELS[slice.plan] ?? slice.plan}</span>
            <span className="text-primary ml-auto text-xs font-semibold tabular-nums">{slice.count}</span>
            <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">{slice.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
