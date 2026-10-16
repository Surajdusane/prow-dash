"use client";

import { ChartEmpty } from "@/components/dashboard/chart-empty";
import { EChartsPieChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-pie-chart";
import { useGetPlanMix } from "@/features/overview/hooks";
import { chartColor, PLAN_COLOR_PAIRS, PLAN_SWATCHES } from "@/lib/chart-colors";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  standard: "Standard",
  premium: "Premium",
};

const chartConfig = {
  starter: { label: "Starter", colors: chartColor(PLAN_COLOR_PAIRS.starter) },
  standard: { label: "Standard", colors: chartColor(PLAN_COLOR_PAIRS.standard) },
  premium: { label: "Premium", colors: chartColor(PLAN_COLOR_PAIRS.premium) },
} satisfies ChartConfig;

export function PlanMixCard() {
  const { data } = useGetPlanMix();

  if (data.length === 0) {
    return <ChartEmpty title="No active subscriptions" description="The plan mix fills in as subscriptions go live." />;
  }

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
