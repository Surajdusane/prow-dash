"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { BoardTicket } from "@/db/queries/tickets";
import { useAssignTicket, useGetTechnicianWorkload, useUpdateTicketStatus } from "@/features/service-ops/hooks";
import { useServiceOpsUiStore } from "@/features/service-ops/store";
import { TICKET_TYPE_LABELS } from "@/features/service-ops/utils";

/**
 * Shown when a ticket is dropped onto Assigned without a technician. Confirming
 * assigns first, then reopens the ticket if it was mid-flight (resolved/in progress).
 */
export function AssignTicketDialog() {
  const pendingTicket = useServiceOpsUiStore((state) => state.pendingAssignTicket);
  const close = useServiceOpsUiStore((state) => state.closeAssignDialog);

  const { data: workload } = useGetTechnicianWorkload();
  const assign = useAssignTicket();
  const updateStatus = useUpdateTicketStatus();

  const [ticket, setTicket] = useState<BoardTicket | null>(null);
  const [technicianId, setTechnicianId] = useState<string | null>(null);
  const wasOpen = useRef(false);
  const open = pendingTicket !== null;

  useEffect(() => {
    if (open && !wasOpen.current) {
      setTicket(pendingTicket);
      setTechnicianId(pendingTicket?.technicianId === null ? null : String(pendingTicket?.technicianId));
    }
    wasOpen.current = open;
  }, [open, pendingTicket]);

  const technicianItems = useMemo(
    () =>
      workload.map((row) => ({
        value: String(row.technicianId),
        label: `${row.technicianName} · ${row.areaName} (${row.openTickets} open)`,
      })),
    [workload]
  );

  const handleAssign = async () => {
    if (!ticket || technicianId === null) return;

    try {
      await assign.mutateAsync({ id: ticket.id, technicianId: Number(technicianId) });
      if (ticket.status !== "open") {
        await updateStatus.mutateAsync({ id: ticket.id, status: "open" });
      }
      close();
    } catch {
      // The mutation hooks surface the failure as a toast; keep the dialog open.
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close();
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Assign ticket{ticket ? ` #${ticket.id}` : ""}</DialogTitle>
          <DialogDescription>
            {ticket
              ? `${TICKET_TYPE_LABELS[ticket.type]} · ${ticket.flatNumber}, ${ticket.societyName} · ${ticket.areaName}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="flex flex-col gap-2">
          <span className="text-sm font-medium">Technician</span>
          <Select items={technicianItems} value={technicianId} onValueChange={(value) => setTechnicianId(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a technician…" />
            </SelectTrigger>
            <SelectPopup>
              {technicianItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
          <p className="text-muted-foreground text-xs">
            The ticket lands in the Assigned column as soon as you confirm.
          </p>
        </DialogPanel>

        <DialogFooter>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button disabled={technicianId === null || assign.isPending || updateStatus.isPending} onClick={handleAssign}>
            {assign.isPending || updateStatus.isPending ? <Spinner /> : null}
            Assign
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
