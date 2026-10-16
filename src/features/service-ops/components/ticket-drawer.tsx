"use client";

import { useMemo, useState } from "react";

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
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { BoardTicket } from "@/db/queries/tickets";
import {
  useAssignTicket,
  useGetTechnicianWorkload,
  useRemoveTicket,
  useUpdateTicketStatus,
} from "@/features/service-ops/hooks";
import { getSlaState, SLA_HOURS, TICKET_STATUS_LABELS, TICKET_TYPE_LABELS } from "@/features/service-ops/utils";
import { confirm } from "@/hooks/use-confirm";
import { formatDateKey } from "@/lib/format";

const UNASSIGNED = "none";

/**
 * Right-side detail drawer for one ticket: facts, technician assignment,
 * status transitions and deletion. Receives the live board ticket so it always
 * reflects optimistic updates.
 */
export function TicketDrawer({ ticket, onClose }: { ticket: BoardTicket | null; onClose: () => void }) {
  const { data: workload } = useGetTechnicianWorkload();
  const assign = useAssignTicket();
  const updateStatus = useUpdateTicketStatus();
  const remove = useRemoveTicket();

  // Keep the last non-null ticket so the drawer content survives the exit
  // animation (Base UI keeps the popup mounted until the close transition ends).
  // Adjusting state during render is the React-documented pattern for this.
  const [snapshot, setSnapshot] = useState<BoardTicket | null>(null);
  if (ticket && ticket !== snapshot) {
    setSnapshot(ticket);
  }

  const view = ticket ?? snapshot;
  const sla = view ? getSlaState(view) : null;

  const technicianItems = useMemo(
    () => [
      { value: UNASSIGNED, label: "Unassigned" },
      ...workload.map((row) => ({
        value: String(row.technicianId),
        label: `${row.technicianName} · ${row.areaName} (${row.openTickets} open)`,
      })),
    ],
    [workload]
  );

  const handleAssign = (value: string | null) => {
    if (!view || value === null) return;
    assign.mutate({ id: view.id, technicianId: value === UNASSIGNED ? null : Number(value) });
  };

  const handleDelete = async () => {
    if (!view) return;
    const confirmed = await confirm({
      title: `Delete ticket #${view.id}?`,
      description: `The ${TICKET_TYPE_LABELS[view.type].toLowerCase()} ticket for ${view.flatNumber}, ${view.societyName} will be removed from the board.`,
      confirmText: "Delete",
    });
    if (!confirmed) return;

    remove.mutate({ id: view.id });
    onClose();
  };

  const statusAction =
    view?.status === "resolved"
      ? { label: "Reopen ticket", next: "open" as const }
      : view?.status === "in_progress"
        ? { label: "Back to assigned", next: "open" as const }
        : { label: "Start work", next: "in_progress" as const };

  return (
    <Drawer
      position="right"
      open={ticket !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DrawerPopup showBar showCloseButton>
        {view ? (
          <>
            <DrawerHeader>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono text-sm">#{view.id}</span>
                <Badge variant="secondary">{TICKET_TYPE_LABELS[view.type]}</Badge>
                {sla ? <Badge variant={sla.tone === "muted" ? "outline" : sla.tone}>{sla.label}</Badge> : null}
              </div>
              <DrawerTitle>
                {view.flatNumber} · {view.societyName}
              </DrawerTitle>
              <DrawerDescription>
                {view.residentName} · {view.areaName}
              </DrawerDescription>
            </DrawerHeader>

            <DrawerPanel className="flex flex-col gap-6">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">Status</dt>
                  <dd className="text-sm font-medium">{TICKET_STATUS_LABELS[view.status]}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">SLA target</dt>
                  <dd className="text-sm font-medium tabular-nums">{SLA_HOURS[view.type]} hours</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">Raised</dt>
                  <dd className="text-sm font-medium">{formatDateKey(view.raisedDate)}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">Resolved</dt>
                  <dd className="text-sm font-medium">
                    {view.resolvedDate ? (
                      formatDateKey(view.resolvedDate)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Technician</span>
                <Select
                  items={technicianItems}
                  value={view.technicianId === null ? UNASSIGNED : String(view.technicianId)}
                  onValueChange={handleAssign}
                  disabled={view.status === "resolved" || assign.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {technicianItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
                {view.status === "resolved" ? (
                  <p className="text-muted-foreground text-xs">Reopen the ticket to change its technician.</p>
                ) : null}
              </div>
            </DrawerPanel>

            <DrawerFooter>
              <Button
                variant="ghost"
                className="text-destructive sm:me-auto"
                disabled={remove.isPending}
                onClick={handleDelete}
              >
                {remove.isPending ? <Spinner /> : null}
                Delete
              </Button>
              <Button
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: view.id, status: statusAction.next })}
              >
                {updateStatus.isPending ? <Spinner /> : null}
                {statusAction.label}
              </Button>
            </DrawerFooter>
          </>
        ) : null}
      </DrawerPopup>
    </Drawer>
  );
}
