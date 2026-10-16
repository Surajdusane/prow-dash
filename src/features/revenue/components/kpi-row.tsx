"use client";

import { AlertTriangle, IndianRupee, Receipt, TrendingUp, Users } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { useGetRevenueKpis } from "@/features/revenue/hooks";
import { formatInr, formatNumber } from "@/lib/format";

export function RevenueKpiRow() {
  const { data } = useGetRevenueKpis();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard label="MRR" value={formatInr(data.mrr)} icon={<IndianRupee />} hint="Active plan prices, monthly" />
      <KpiCard
        label="ARPU"
        value={formatInr(data.arpu)}
        icon={<TrendingUp />}
        hint="Monthly revenue ÷ active subscriptions"
      />
      <KpiCard
        label="Active subs"
        value={formatNumber(data.activeSubs)}
        icon={<Users />}
        hint="Subscriptions billing today"
      />
      <KpiCard
        label="Failed this month"
        value={`${data.failedPctThisMonth}%`}
        icon={<AlertTriangle />}
        hint="Share of this month's payments that failed"
      />
      <KpiCard
        label="Collections (90d)"
        value={`${data.collectionsRate90d}%`}
        icon={<Receipt />}
        hint="Collected ÷ billed across the last 3 billing months"
      />
    </div>
  );
}
