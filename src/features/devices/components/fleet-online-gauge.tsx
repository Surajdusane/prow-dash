"use client";

import { useMemo } from "react";

import { EChartsRadialChart, type ChartConfig } from "@/components/evilcharts/charts/echarts-radial-chart";
import { useGetFleetStats } from "@/features/devices/hooks";
import { formatNumber } from "@/lib/format";

function onlineTone(pct: number): { light: string; dark: string } {
  if (pct >= 95) return { light: "#059669", dark: "#34d399" };
  if (pct >= 90) return { light: "#d97706", dark: "#fbbf24" };
  return { light: "#e11d48", dark: "#fb7185" };
}

/**
 * Ring gauge for fleet connectivity, with the two actionable counts below.
 *
 * The chart box uses a fixed height rather than a flexible one: the canvas is
 * measured when it mounts, so a height that depends on the surrounding grid can
 * leave the ring drawn off the visible card. A fixed box keeps the gauge
 * legible at every breakpoint, and the flexible wrapper centres the ring in the
 * card whenever the row stretches taller than the gauge's natural height.
 */
export function FleetOnlineGauge() {
  const { data } = useGetFleetStats();

  const tone = useMemo(() => onlineTone(data.onlinePct), [data.onlinePct]);
  const chartConfig = useMemo(
    () =>
      ({
        online: { label: "Online", colors: { light: [tone.light], dark: [tone.dark] } },
      }) satisfies ChartConfig,
    [tone]
  );
  const chartData = useMemo(() => [{ name: "online", value: data.onlinePct }], [data.onlinePct]);

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="flex flex-1 items-center justify-center">
        <div className="relative h-60 w-full">
          <EChartsRadialChart
            data={chartData}
            config={chartConfig}
            nameKey="name"
            variant="full"
            max={100}
            className="h-full w-full"
          >
            <EChartsRadialChart.RadialBar dataKey="value" barSize={20} cornerRadius={10} showBackground />
          </EChartsRadialChart>

          {/* Readout sits dead-centre in the ring's hole. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{data.onlinePct}%</span>
            <span className="text-muted-foreground text-xs">Fleet online</span>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 border-t pt-4">
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground text-xs">Needs service</dt>
          <dd className="text-sm font-medium tabular-nums">{formatNumber(data.needsServiceCount)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground text-xs">Offline &gt; 7d</dt>
          <dd className="text-sm font-medium tabular-nums">{formatNumber(data.offlineCount)}</dd>
        </div>
      </dl>
    </div>
  );
}
