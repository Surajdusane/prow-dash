"use client";

import { ChartEmpty } from "@/components/dashboard/chart-empty";
import { EChartsPieChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-pie-chart";
import { useGetRiskDistribution } from "@/features/customers/hooks";
import { RISK_BAND_LABELS, RISK_BAND_SWATCHES } from "@/features/customers/utils";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const chartConfig = {
  low: { label: "Low", colors: { light: ["#059669"], dark: ["#34d399"] } },
  medium: { label: "Medium", colors: { light: ["#d97706"], dark: ["#fbbf24"] } },
  high: { label: "High", colors: { light: ["#e11d48"], dark: ["#fb7185"] } },
} satisfies ChartConfig;

/** Donut of the active book by risk band, with a readable legend list. */
export function RiskDistributionCard() {
  const { data } = useGetRiskDistribution();

  const ordered = [...data].sort(
    (a, b) => ["low", "medium", "high"].indexOf(a.band) - ["low", "medium", "high"].indexOf(b.band)
  );
  const total = data.reduce((sum, band) => sum + band.count, 0);

  if (data.length === 0) {
    return <ChartEmpty title="No households to score" description="Risk bands appear once households are active." />;
  }

  return (
    <div className="flex h-full flex-col items-center gap-4 p-2 sm:flex-row sm:gap-6">
      <div className="relative aspect-square w-full max-w-56 shrink-0 sm:w-[46%]">
        <EChartsPieChart data={ordered} config={chartConfig} dataKey="count" nameKey="band" className="h-full w-full">
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
            <span className="font-heading text-primary text-xl leading-none font-semibold tracking-tight tabular-nums">
              {formatNumber(total)}
            </span>
            <span className="text-muted-foreground mt-1 text-[10px] sm:text-xs">Active</span>
          </div>
        </div>
      </div>

      <ul className="flex min-h-0 w-full min-w-0 flex-1 flex-col justify-center">
        {ordered.map((band) => (
          <li key={band.band} className="flex items-center gap-2 py-1.5 sm:py-2">
            <span aria-hidden className={cn("size-2.5 shrink-0 rounded-[3px]", RISK_BAND_SWATCHES[band.band])} />
            <span className="text-muted-foreground truncate text-xs">{RISK_BAND_LABELS[band.band]}</span>
            <span className="text-primary ml-auto text-xs font-semibold tabular-nums">{formatNumber(band.count)}</span>
            <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">{band.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
