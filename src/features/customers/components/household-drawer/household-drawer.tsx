"use client";

import { useState } from "react";

import { MessageSquarePlus } from "lucide-react";

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
import { useGetHouseholdProfile } from "@/features/customers/hooks";
import { useCustomersUiStore } from "@/features/customers/store";
import {
  DISPENSER_TYPE_LABELS,
  HOUSEHOLD_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  paymentStatusVariant,
  PLAN_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_TYPE_LABELS,
  ticketStatusVariant,
} from "@/features/customers/utils";
import { formatDateKey, formatInr, formatMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

import { HouseholdDrawerSkeleton } from "../skeletons";
import { ComplaintsList } from "./complaints-list";
import { ReadingsSparkline } from "./readings-sparkline";
import { RiskRing } from "./risk-ring";

/** How many history rows each drawer section shows before it truncates. */
const TICKETS_DISPLAY = 5;
const COMPLAINTS_DISPLAY = 6;
const PAYMENTS_DISPLAY = 6;

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="text-sm font-medium">{title}</h3>
      {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

/**
 * Household profile drawer. Its `getById` query is completely separate from the
 * risk table, so opening a row never refetches (or re-renders) the table. The
 * snapshot id keeps the content visible through the close animation.
 */
export function HouseholdDrawer() {
  const selectedId = useCustomersUiStore((state) => state.selectedHouseholdId);
  const close = useCustomersUiStore((state) => state.closeHousehold);
  const openAddComplaint = useCustomersUiStore((state) => state.openAddComplaint);

  // Keep the last non-null id so the drawer content survives the exit animation
  // (Base UI keeps the popup mounted until the close transition ends).
  const [snapshotId, setSnapshotId] = useState<number | null>(null);
  if (selectedId !== null && selectedId !== snapshotId) {
    setSnapshotId(selectedId);
  }
  const householdId = selectedId ?? snapshotId;

  const { data, isPending, isError, refetch } = useGetHouseholdProfile(householdId);
  const loading = isPending;
  const failed = isError || (!isPending && data === null);

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
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="size-16 rounded-full" />
            </div>
          ) : data ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={data.household.status === "active" ? "secondary" : "outline"}>
                    {HOUSEHOLD_STATUS_LABELS[data.household.status]}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{data.household.areaName}</span>
                </div>
                <DrawerTitle>
                  Flat {data.household.flatNumber} · {data.household.societyName}
                </DrawerTitle>
                <DrawerDescription>
                  {data.household.residentName} · joined {formatDateKey(data.household.joinDate)}
                </DrawerDescription>
              </div>
              <RiskRing score={data.household.riskScore} className="shrink-0" />
            </div>
          ) : (
            <DrawerTitle>Household</DrawerTitle>
          )}
        </DrawerHeader>

        <DrawerPanel className="flex flex-col gap-6">
          {failed ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm font-medium">Couldn&apos;t load this household</p>
              <p className="text-muted-foreground text-sm">
                The profile request failed. This is usually a cold database - try again.
              </p>
              <Button variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : loading || !data ? (
            <HouseholdDrawerSkeleton />
          ) : (
            <>
              <section className="flex flex-col gap-3">
                <SectionHeading title="Water quality" hint="Last 30 days" />
                {data.readings.length > 0 ? (
                  <ReadingsSparkline readings={data.readings} />
                ) : (
                  <EmptyNote>No readings recorded in the last 30 days.</EmptyNote>
                )}
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                <section className="border-border flex flex-col gap-3 rounded-xl border p-4">
                  <h3 className="text-sm font-medium">Subscription</h3>
                  {data.subscription ? (
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                      <Field label="Plan" value={PLAN_LABELS[data.subscription.planName]} />
                      <Field label="Monthly" value={formatInr(data.subscription.monthlyPrice)} />
                      <Field label="Started" value={formatDateKey(data.subscription.startDate)} />
                      <Field label="Status" value={SUBSCRIPTION_STATUS_LABELS[data.subscription.status]} />
                    </dl>
                  ) : (
                    <EmptyNote>No subscription on record.</EmptyNote>
                  )}
                </section>

                <section className="border-border flex flex-col gap-3 rounded-xl border p-4">
                  <h3 className="text-sm font-medium">Dispenser</h3>
                  {data.dispenser ? (
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                      <Field label="Type" value={DISPENSER_TYPE_LABELS[data.dispenser.type]} />
                      <Field
                        label="Connectivity"
                        value={
                          <span className="flex items-center gap-1.5">
                            <span
                              aria-hidden
                              className={cn(
                                "size-1.5 rounded-full",
                                data.dispenser.isOnline ? "bg-emerald-500" : "bg-rose-500"
                              )}
                            />
                            {data.dispenser.isOnline ? "Online" : "Offline"}
                          </span>
                        }
                      />
                      <Field label="Installed" value={formatDateKey(data.dispenser.installDate)} />
                      <Field label="Last filter change" value={formatDateKey(data.dispenser.lastFilterChangeDate)} />
                    </dl>
                  ) : (
                    <EmptyNote>No dispenser installed.</EmptyNote>
                  )}
                </section>
              </div>

              <section className="flex flex-col gap-3">
                <SectionHeading title="Service tickets" hint={`${data.tickets.length} total`} />
                {data.tickets.length === 0 ? (
                  <EmptyNote>No service tickets yet.</EmptyNote>
                ) : (
                  <ul className="divide-border flex flex-col divide-y">
                    {data.tickets.slice(0, TICKETS_DISPLAY).map((ticket) => (
                      <li
                        key={ticket.id}
                        className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex min-w-0 flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{TICKET_TYPE_LABELS[ticket.type]}</span>
                            <span className="text-muted-foreground font-mono text-xs">#{ticket.id}</span>
                            {ticket.slaMet === false ? (
                              <Badge size="sm" variant="error">
                                SLA missed
                              </Badge>
                            ) : null}
                          </div>
                          <span className="text-muted-foreground text-xs">
                            Raised {formatDateKey(ticket.raisedDate)} · {ticket.technicianName ?? "unassigned"}
                          </span>
                        </div>
                        <Badge size="sm" variant={ticketStatusVariant(ticket.status)} className="shrink-0">
                          {TICKET_STATUS_LABELS[ticket.status]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
                {data.tickets.length > TICKETS_DISPLAY ? (
                  <p className="text-muted-foreground text-xs">
                    Showing the latest {TICKETS_DISPLAY} of {data.tickets.length} tickets.
                  </p>
                ) : null}
              </section>

              <section className="flex flex-col gap-3">
                <SectionHeading title="Complaints" hint={`${data.complaints.length} total`} />
                <ComplaintsList complaints={data.complaints.slice(0, COMPLAINTS_DISPLAY)} />
                {data.complaints.length > COMPLAINTS_DISPLAY ? (
                  <p className="text-muted-foreground text-xs">
                    Showing the latest {COMPLAINTS_DISPLAY} of {data.complaints.length} complaints.
                  </p>
                ) : null}
              </section>

              <section className="flex flex-col gap-3">
                <SectionHeading title="Payments" hint={`${data.payments.length} recorded`} />
                {data.payments.length === 0 ? (
                  <EmptyNote>No payments recorded.</EmptyNote>
                ) : (
                  <ul className="divide-border flex flex-col divide-y">
                    {data.payments.slice(0, PAYMENTS_DISPLAY).map((payment) => (
                      <li
                        key={payment.id}
                        className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">{formatMonth(payment.billingMonth)}</span>
                          <span className="text-muted-foreground text-xs">
                            {payment.paidDate ? `Paid ${formatDateKey(payment.paidDate)}` : "Not paid yet"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm tabular-nums">{formatInr(payment.amount)}</span>
                          <Badge size="sm" variant={paymentStatusVariant(payment.status)}>
                            {PAYMENT_STATUS_LABELS[payment.status]}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {data.payments.length > PAYMENTS_DISPLAY ? (
                  <p className="text-muted-foreground text-xs">
                    Showing the latest {PAYMENTS_DISPLAY} of {data.payments.length} payments.
                  </p>
                ) : null}
              </section>
            </>
          )}
        </DrawerPanel>

        <DrawerFooter>
          <Button
            disabled={householdId === null}
            onClick={() => {
              if (householdId !== null) openAddComplaint(householdId);
            }}
          >
            <MessageSquarePlus />
            Add complaint
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  );
}
