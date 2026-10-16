"use client";

import { AlertTriangle, CalendarRange, UserMinus, Users } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { useGetHouseholdKpis, useGetRiskDistribution } from "@/features/customers/hooks";
import { formatNumber } from "@/lib/format";

export function CustomersKpiRow() {
  const { data } = useGetHouseholdKpis();
  const { data: distribution } = useGetRiskDistribution();

  const high = distribution.find((band) => band.band === "high");
  const highShare = high && data.activeHouseholds > 0 ? Math.round((high.count / data.activeHouseholds) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Active households"
        value={formatNumber(data.activeHouseholds)}
        icon={<Users />}
        hint="Subscribed and billing today"
      />
      <KpiCard
        label="High risk"
        value={formatNumber(data.highRiskCount)}
        icon={<AlertTriangle />}
        hint={`Risk score ≥ 67 · ${highShare}% of the active book`}
      />
      <KpiCard
        label="Churned (90d)"
        value={formatNumber(data.churned90d)}
        icon={<UserMinus />}
        hint="Cancelled in the last 90 days"
      />
      <KpiCard
        label="Avg tenure"
        value={
          data.avgTenureDays >= 365 ? `${(data.avgTenureDays / 365).toFixed(1)} yrs` : `${data.avgTenureDays} days`
        }
        icon={<CalendarRange />}
        hint="Across active households"
      />
    </div>
  );
}
