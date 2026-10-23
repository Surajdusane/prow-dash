"use client";

import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCreateTicket, useGetAnomalies } from "@/features/devices/hooks";
import { useDevicesUiStore } from "@/features/devices/store";
import {
  ANOMALY_SEVERITY_LABELS,
  anomalyBadgeVariant,
  formatRelativeTime,
  ticketTypeForAnomaly,
} from "@/features/devices/utils";

/** How many anomalies the panel renders before it truncates. */
const ANOMALIES_DISPLAY = 6;

/**
 * Severity-sorted anomaly feed. The two actions are the route's whole
 * interaction surface: "View device" opens the read-only drawer, and
 * "Create ticket" dispatches into Service Ops.
 */
export function AnomalyPanel() {
  const { data } = useGetAnomalies();
  const openDispenser = useDevicesUiStore((state) => state.openDispenser);
  const createTicket = useCreateTicket();

  const visible = data.slice(0, ANOMALIES_DISPLAY);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Anomalies</CardTitle>
        <p className="text-muted-foreground text-sm">
          Devices flagged by telemetry - offline, no readings, rising TDS or low purity - worst first.
        </p>
      </CardHeader>

      <CardPanel className="p-0 pt-0">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <CheckCircle2 className="text-muted-foreground size-5" />
            <p className="text-sm font-medium">No anomalies right now</p>
            <p className="text-muted-foreground text-sm">
              Every device is online with healthy TDS and purity readings.
            </p>
          </div>
        ) : (
          <ul className="divide-border divide-y">
            {visible.map((anomaly) => {
              const creating = createTicket.isPending && createTicket.variables?.householdId === anomaly.householdId;

              return (
                <li key={anomaly.dispenserId} className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge size="sm" variant={anomalyBadgeVariant(anomaly.severity)}>
                        {ANOMALY_SEVERITY_LABELS[anomaly.severity]}
                      </Badge>
                      <span className="text-sm font-medium">
                        Flat {anomaly.flatNumber} · {anomaly.societyName}
                      </span>
                      <span className="text-muted-foreground font-mono text-xs">#{anomaly.dispenserId}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {anomaly.residentName} · {anomaly.areaName}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {anomaly.reasons.join(" · ")} · last reading {formatRelativeTime(anomaly.lastReadingAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openDispenser(anomaly.dispenserId)}>
                      View device
                    </Button>
                    <Button
                      size="sm"
                      disabled={creating}
                      onClick={() =>
                        createTicket.mutate({
                          householdId: anomaly.householdId,
                          type: ticketTypeForAnomaly(anomaly),
                        })
                      }
                    >
                      {creating ? <Spinner /> : null}
                      Create ticket
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {data.length > ANOMALIES_DISPLAY ? (
          <p className="text-muted-foreground px-6 pb-6 text-xs">
            Showing the {ANOMALIES_DISPLAY} most severe of {data.length} flagged devices.
          </p>
        ) : null}
      </CardPanel>
    </Card>
  );
}
