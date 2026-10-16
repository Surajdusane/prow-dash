"use client";

import { Droplets, Wifi, WifiOff, Wrench } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { useGetFleetStats } from "@/features/devices/hooks";
import { formatNumber } from "@/lib/format";

export function DevicesKpiRow() {
  const { data } = useGetFleetStats();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Online" value={`${data.onlinePct}%`} icon={<Wifi />} hint="Reported within the last 7 days" />
      <KpiCard
        label="Avg purity (7d)"
        value={`${data.avgPurity7d}%`}
        icon={<Droplets />}
        hint="Fleet-wide readings this week"
      />
      <KpiCard
        label="Needs service"
        value={formatNumber(data.needsServiceCount)}
        icon={<Wrench />}
        hint="Filter age > 75d, TDS > 450 or purity < 85%"
      />
      <KpiCard
        label="Offline > 7d"
        value={formatNumber(data.offlineCount)}
        icon={<WifiOff />}
        hint="Silent for over a week"
      />
    </div>
  );
}
