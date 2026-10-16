"use client";

import { Home, Target, TrendingUp, Users } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { useGetLeadsKpis } from "@/features/leads/hooks";
import { formatNumber } from "@/lib/format";

export function LeadsKpiRow() {
  const { data } = useGetLeadsKpis();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Total leads" value={formatNumber(data.totalLeads)} icon={<Users />} hint="Across every channel" />
      <KpiCard
        label="Visit rate"
        value={`${data.visitRate}%`}
        icon={<TrendingUp />}
        hint="Leads that booked a site visit"
      />
      <KpiCard
        label="Conversion rate"
        value={`${data.conversionRate}%`}
        icon={<Target />}
        hint="Leads converted to households"
      />
      <KpiCard
        label="Flats converted QTD"
        value={formatNumber(data.flatsConvertedQtd)}
        icon={<Home />}
        hint="Across leads created this quarter"
      />
    </div>
  );
}
