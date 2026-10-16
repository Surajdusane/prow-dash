"use client";

import { CalendarClock, Droplets, Recycle, Users } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { useGetImpactTotals } from "@/features/sustainability/hooks";
import { formatNumber } from "@/lib/format";

export function ImpactTiles() {
  const { data } = useGetImpactTotals();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Litres served"
        value={`${formatNumber(data.litresServed)} L`}
        icon={<Droplets />}
        hint="Estimated from plan daily usage"
      />
      <KpiCard
        label="20 L jars avoided"
        value={formatNumber(data.jarsAvoided)}
        icon={<Recycle />}
        hint="Equivalent plastic jars not consumed"
      />
      <KpiCard
        label="Households served"
        value={formatNumber(data.householdsServed)}
        icon={<Users />}
        hint="Every household ever subscribed"
      />
      <KpiCard
        label="Months live"
        value={formatNumber(data.monthsLive)}
        icon={<CalendarClock />}
        hint="Since the first subscription"
      />
    </div>
  );
}
