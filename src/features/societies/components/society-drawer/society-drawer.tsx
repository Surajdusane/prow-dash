"use client";

import { useState } from "react";
import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { riskBand, type RiskBand } from "@/db/queries/risk";
import { useGetSocietyDetail } from "@/features/societies/hooks";
import { useSocietiesUiStore } from "@/features/societies/store";
import { PLAN_LABELS, PLAN_ORDER } from "@/features/societies/utils";
import { PLAN_SWATCHES } from "@/lib/chart-colors";
import { formatDateKey, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { SocietyDrawerSkeleton } from "../skeletons";

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="text-sm font-medium">{title}</h3>
      {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="border-border flex flex-col gap-0.5 rounded-xl border p-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-heading text-xl font-semibold tracking-tight tabular-nums">{value}</span>
      {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

const RISK_BAND_TEXT: Record<RiskBand, string> = {
  low: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-rose-600 dark:text-rose-400",
};

function formatTenure(days: number): string {
  if (days < 90) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} mo`;
  const years = days / 365;
  return `${years >= 10 ? Math.round(years) : years.toFixed(1)} yrs`;
}

/**
 * Society profile drawer. Its `getById` query is completely separate from the
 * society table, so opening a row never refetches (or re-renders) the table.
 * The snapshot id keeps the content visible through the close animation.
 */
export function SocietyDrawer() {
  const selectedId = useSocietiesUiStore((state) => state.selectedSocietyId);
  const close = useSocietiesUiStore((state) => state.closeSociety);

  // Keep the last non-null id so the drawer content survives the exit animation
  // (Base UI keeps the popup mounted until the close transition ends).
  const [snapshotId, setSnapshotId] = useState<number | null>(null);
  if (selectedId !== null && selectedId !== snapshotId) {
    setSnapshotId(selectedId);
  }
  const societyId = selectedId ?? snapshotId;

  const { data, isPending, isError, refetch } = useGetSocietyDetail(societyId);
  const loading = isPending;
  const failed = isError || (!isPending && data === null);

  const totalPlans = data?.planBreakdown.reduce((sum, entry) => sum + entry.count, 0) ?? 0;

  return (
    <Drawer
      position="right"
      open={selectedId !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DrawerPopup showBar showCloseButton className="sm:max-w-xl">
        <DrawerHeader>
          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-44" />
            </div>
          ) : data ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{data.society.areaName}</Badge>
                <span className="text-muted-foreground text-xs">
                  {formatNumber(data.society.totalFlats)} flats covered
                </span>
              </div>
              <DrawerTitle>{data.society.name}</DrawerTitle>
              <DrawerDescription>Onboarded {formatDateKey(data.society.onboardedDate)}</DrawerDescription>
            </div>
          ) : (
            <DrawerTitle>Society</DrawerTitle>
          )}
        </DrawerHeader>

        <DrawerPanel className="flex flex-col gap-6">
          {failed ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm font-medium">Couldn&apos;t load this society</p>
              <p className="text-muted-foreground text-sm">
                The profile request failed. This is usually a cold database — try again.
              </p>
              <Button variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : loading || !data ? (
            <SocietyDrawerSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Stat
                  label="Penetration"
                  value={`${data.penetrationPct}%`}
                  hint={`${formatNumber(data.subscribed)} of ${formatNumber(data.society.totalFlats)} flats active`}
                />
                <Stat label="Open tickets" value={formatNumber(data.openTickets)} hint="Not yet resolved" />
                <Stat
                  label="Avg TDS (30d)"
                  value={data.avgTds30d !== null ? formatNumber(data.avgTds30d) : "—"}
                  hint={data.avgTds30d !== null ? "ppm across households" : "No readings in 30 days"}
                />
                <Stat label="Active households" value={formatNumber(data.subscribed)} hint="Subscribed today" />
              </div>

              <section className="flex flex-col gap-3">
                <SectionHeading title="Plan mix" hint={`${formatNumber(totalPlans)} active subscriptions`} />
                {totalPlans === 0 ? (
                  <EmptyNote>No active subscriptions in this society.</EmptyNote>
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {PLAN_ORDER.map((plan) => {
                      const count = data.planBreakdown.find((entry) => entry.plan === plan)?.count ?? 0;
                      const share = Math.round((count / totalPlans) * 100);

                      return (
                        <li key={plan} className="flex items-center gap-3">
                          <span className={cn("size-2 shrink-0 rounded-[2px]", PLAN_SWATCHES[plan])} aria-hidden />
                          <span className="w-20 text-sm">{PLAN_LABELS[plan]}</span>
                          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                            <div
                              className={cn("h-full rounded-full", PLAN_SWATCHES[plan])}
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="w-16 text-right text-sm tabular-nums">
                            {formatNumber(count)} · {share}%
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="flex flex-col gap-3">
                <SectionHeading title="Highest risk households" hint="Open in Customers" />
                {data.topRisk.length === 0 ? (
                  <EmptyNote>No active households in this society.</EmptyNote>
                ) : (
                  <ul className="divide-border flex flex-col divide-y">
                    {data.topRisk.map((household) => {
                      const band = riskBand(household.riskScore);

                      return (
                        <li key={household.householdId}>
                          <Link
                            href="/customers"
                            className="hover:bg-accent/50 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors"
                          >
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <span className="text-sm font-medium">
                                Flat {household.flatNumber} · {household.residentName}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                Tenure {formatTenure(household.tenureDays)}
                              </span>
                            </div>
                            <span className="flex shrink-0 items-center gap-1.5">
                              <span className={cn("text-sm font-medium tabular-nums", RISK_BAND_TEXT[band])}>
                                {household.riskScore}
                              </span>
                              <ArrowUpRight className="text-muted-foreground size-3.5" />
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )}
        </DrawerPanel>

        <DrawerFooter>
          <Button variant="outline" render={<Link href="/customers" />}>
            Open in Customers
            <ArrowUpRight />
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  );
}
