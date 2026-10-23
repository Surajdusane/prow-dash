import type { Metadata } from "next";

import { EChartsAudienceAreaChart } from "@/components/evilcharts/blocks/audience-echarts-area-chart";
import { EChartsBenchmarkAreaChart } from "@/components/evilcharts/blocks/benchmark-echarts-area-chart";
import { EChartsBudgetRadialChart } from "@/components/evilcharts/blocks/budget-echarts-radial-chart";
import { EChartsCacheTiersRadialChart } from "@/components/evilcharts/blocks/cache-tiers-echarts-radial-chart";
import { EChartsGridBarChart } from "@/components/evilcharts/blocks/grid-echarts-bar-chart";
import { EChartsLatencyAreaChart } from "@/components/evilcharts/blocks/latency-echarts-area-chart";
import { EChartsMarketSharePieChart } from "@/components/evilcharts/blocks/market-share-echarts-pie-chart";
import { EChartsPeakBarChart } from "@/components/evilcharts/blocks/peak-echarts-bar-chart";
import { EChartsPortfolioAreaChart } from "@/components/evilcharts/blocks/portfolio-echarts-area-chart";
import { EChartsReliabilityScorePieChart } from "@/components/evilcharts/blocks/reliability-score-echarts-pie-chart";
import { EChartsRevenueMixPieChart } from "@/components/evilcharts/blocks/revenue-mix-echarts-pie-chart";
import { EChartsRideRadialChart } from "@/components/evilcharts/blocks/ride-echarts-radial-chart";

export const metadata: Metadata = {
  title: "Charts gallery",
};

const blocks = [
  { title: "Portfolio - area chart", Component: EChartsPortfolioAreaChart },
  { title: "Latency - area chart", Component: EChartsLatencyAreaChart },
  { title: "Benchmark - area chart", Component: EChartsBenchmarkAreaChart },
  { title: "Audience - area chart", Component: EChartsAudienceAreaChart },
  { title: "Peak - bar chart", Component: EChartsPeakBarChart },
  { title: "Grid - bar chart", Component: EChartsGridBarChart },
  { title: "Revenue mix - pie chart", Component: EChartsRevenueMixPieChart },
  { title: "Market share - pie chart", Component: EChartsMarketSharePieChart },
  { title: "Reliability score - pie chart", Component: EChartsReliabilityScorePieChart },
  { title: "Budget - radial chart", Component: EChartsBudgetRadialChart },
  { title: "Cache tiers - radial chart", Component: EChartsCacheTiersRadialChart },
  { title: "Ride - radial chart", Component: EChartsRideRadialChart },
];

export default function DevChartsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Charts gallery</h1>
        <p className="text-muted-foreground text-sm">
          Dev-only reference of the evilcharts dashboard blocks (<code>src/components/evilcharts/blocks</code>) used
          across the dashboard. Copy and adapt their composition into feature charts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {blocks.map(({ title, Component }) => (
          <section key={title} className="flex flex-col gap-2">
            <h2 className="text-muted-foreground text-sm font-medium">{title}</h2>
            <div className="h-80 rounded-2xl border p-4">
              <Component />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
