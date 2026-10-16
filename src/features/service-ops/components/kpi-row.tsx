"use client";

import { AlertTriangle, CheckCircle2, Inbox, Timer } from "lucide-react";

import { KpiCard, KpiCardSkeleton } from "@/components/dashboard/kpi-card";
import { useGetSlaStats } from "@/features/service-ops/hooks";
import { formatNumber } from "@/lib/format";

export function ServiceOpsKpiRowSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <KpiCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ServiceOpsKpiRow() {
  const { data } = useGetSlaStats();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Open tickets" value={formatNumber(data.open)} icon={<Inbox />} hint="Open + in progress" />
      <KpiCard
        label="Overdue backlog"
        value={formatNumber(data.overdue7d)}
        icon={<AlertTriangle />}
        hint="Open for more than 7 days"
      />
      <KpiCard
        label="Avg resolution"
        value={`${data.avgResolutionDays} days`}
        icon={<Timer />}
        hint="Raise date to resolve date"
      />
      <KpiCard
        label="SLA met (90d)"
        value={`${data.slaMetPct90d}%`}
        icon={<CheckCircle2 />}
        hint="Resolved within target, last 90 days"
      />
    </div>
  );
}
