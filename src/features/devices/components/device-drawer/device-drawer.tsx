"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerDescription, DrawerHeader, DrawerPanel, DrawerPopup, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { ChartLegend } from "@/components/dashboard/chart-legend";
import { useGetReadings } from "@/features/devices/hooks";
import { useDevicesUiStore } from "@/features/devices/store";
import { DISPENSER_TYPE_LABELS, filterAgeDays, PURITY_SWATCH, TDS_SWATCH } from "@/features/devices/utils";
import { formatDateKey } from "@/lib/format";
import { cn } from "@/lib/utils";

import { DeviceDrawerSkeleton } from "../skeletons";
import { ReadingsChart } from "./readings-chart";

/** Mirrors the server's filter-due threshold (max natural filter cycle). */
const SERVICE_DUE_DAYS = 75;

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

/**
 * Device telemetry drawer. Read-only by design: its only job is the 30/90-day
 * readings window, and the payload is kept in sync with the selected device so
 * a switch never shows another dispenser's curve.
 */
export function DeviceDrawer() {
  const selectedId = useDevicesUiStore((state) => state.selectedDispenserId);
  const close = useDevicesUiStore((state) => state.closeDispenser);

  // Keep the last non-null id so the drawer content survives the exit animation.
  const [snapshotId, setSnapshotId] = useState<number | null>(null);
  if (selectedId !== null && selectedId !== snapshotId) {
    setSnapshotId(selectedId);
  }
  const dispenserId = selectedId ?? snapshotId;

  // Reset to the 30-day window whenever a different device is opened. Adjusting
  // state during render is the React-documented pattern for derived resets.
  const [days, setDays] = useState<30 | 90>(30);
  const [lastId, setLastId] = useState<number | null>(null);
  if (dispenserId !== null && dispenserId !== lastId) {
    setLastId(dispenserId);
    setDays(30);
  }

  const { data, isError, refetch } = useGetReadings(dispenserId, days);

  // `keepPreviousData` keeps the chart on screen while a *window* toggles, but
  // we must never render one device's readings under another device's header.
  const loaded = data !== undefined && data.dispenser.id === dispenserId;

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
          {loaded ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground font-mono text-sm">#{data.dispenser.id}</span>
                <Badge variant="secondary">{DISPENSER_TYPE_LABELS[data.dispenser.type]}</Badge>
                <Badge variant={data.dispenser.isOnline ? "success" : "error"}>
                  {data.dispenser.isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
              <DrawerTitle>
                Flat {data.dispenser.flatNumber} · {data.dispenser.societyName}
              </DrawerTitle>
              <DrawerDescription>
                {data.dispenser.residentName} · {data.dispenser.areaName}
              </DrawerDescription>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-6 w-60" />
              <Skeleton className="h-4 w-52" />
            </div>
          )}
        </DrawerHeader>

        <DrawerPanel className="flex flex-col gap-6">
          {isError && !loaded ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm font-medium">Couldn&apos;t load this device</p>
              <p className="text-muted-foreground text-sm">
                The readings request failed. This is usually a cold database - try again.
              </p>
              <Button variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : !loaded ? (
            <DeviceDrawerSkeleton />
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                <Field label="Installed" value={formatDateKey(data.dispenser.installDate)} />
                <Field label="Last filter change" value={formatDateKey(data.dispenser.lastFilterChangeDate)} />
                <Field
                  label="Filter age"
                  value={
                    <span
                      className={cn(
                        filterAgeDays(data.dispenser.lastFilterChangeDate) >= SERVICE_DUE_DAYS &&
                          "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {filterAgeDays(data.dispenser.lastFilterChangeDate)} days
                    </span>
                  }
                />
              </dl>

              <section className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-medium">Telemetry</h3>
                  <Tabs value={String(days)} onValueChange={(value) => setDays(value === "90" ? 90 : 30)}>
                    <TabsList>
                      <TabsTab value="30">30 days</TabsTab>
                      <TabsTab value="90">90 days</TabsTab>
                    </TabsList>
                  </Tabs>
                </div>

                <ChartLegend
                  items={[
                    { label: "TDS (ppm)", swatch: TDS_SWATCH },
                    { label: "Purity (%)", swatch: PURITY_SWATCH },
                    { label: "Hover the filter-reset reading for its date" },
                  ]}
                />

                <div className="h-72 w-full">
                  {data.readings.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground text-sm">No readings in the last {days} days.</p>
                    </div>
                  ) : (
                    <ReadingsChart
                      readings={data.readings}
                      lastFilterChangeDate={data.dispenser.lastFilterChangeDate}
                    />
                  )}
                </div>
              </section>
            </>
          )}
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  );
}
