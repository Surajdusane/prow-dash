"use client";

import { Building2, Home, MapPin, Percent } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { useGetSocietiesKpis } from "@/features/societies/hooks";
import { formatNumber } from "@/lib/format";

export function SocietiesKpiRow() {
  const { data } = useGetSocietiesKpis();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Societies"
        value={formatNumber(data.societies)}
        icon={<Building2 />}
        hint="Onboarded across the portfolio"
      />
      <KpiCard
        label="Avg penetration"
        value={`${data.avgPenetration}%`}
        icon={<Percent />}
        hint="Active households ÷ flats covered"
      />
      <KpiCard
        label="Flats covered"
        value={formatNumber(data.flatsCovered)}
        icon={<Home />}
        hint="Total flats in onboarded societies"
      />
      <KpiCard label="Areas" value={formatNumber(data.areas)} icon={<MapPin />} hint="Neighbourhoods with coverage" />
    </div>
  );
}
