"use client";

import { Droplets, IndianRupee, TrendingDown, UserPlus, Users, Wrench } from "lucide-react";

import { KpiCard, KpiCardSkeleton } from "@/components/dashboard/kpi-card";
import { useGetOverviewKpis } from "@/features/overview/hooks";
import { formatInr, formatNumber } from "@/lib/format";

export function KpiRowSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }, (_, index) => (
        <KpiCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function OverviewKpiRow() {
  const { data } = useGetOverviewKpis();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        label="Active households"
        value={formatNumber(data.activeHouseholds)}
        icon={<Users />}
        hint="Subscribed across 50 societies"
      />
      <KpiCard label="MRR" value={formatInr(data.mrr)} icon={<IndianRupee />} hint="Active plan prices, monthly" />
      <KpiCard
        label="90-day churn"
        value={`${data.churnRate90d}%`}
        icon={<TrendingDown />}
        hint="Cancellations vs households active 90d ago"
      />
      <KpiCard
        label="Open tickets"
        value={formatNumber(data.openTickets)}
        icon={<Wrench />}
        hint="Open + in progress"
      />
      <KpiCard
        label="New this month"
        value={formatNumber(data.newThisMonth)}
        icon={<UserPlus />}
        hint="Households joined since month start"
      />
      <KpiCard
        label="Fleet avg purity (7d)"
        value={`${data.avgPurity7d}%`}
        icon={<Droplets />}
        hint="Across all dispenser readings"
      />
    </div>
  );
}
