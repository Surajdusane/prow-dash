"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { useTRPC } from "@/trpc/client";

const TICKET_TYPE_LABELS: Record<"filter_change" | "repair" | "installation" | "inspection", string> = {
  filter_change: "Filter change",
  repair: "Repair",
  installation: "Installation",
  inspection: "Inspection",
};

/**
 * The Devices route is read-only — this is its single write path: an anomaly's
 * "Create ticket" shortcut dispatches into Service Ops and then refreshes both
 * the anomaly feed and the service board.
 */
export const useCreateTicket = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.serviceOps.createTicket.mutationOptions({
      onSuccess: (ticket) => {
        toastManager.add({
          title: "Ticket created",
          description: `#${ticket.id} · ${TICKET_TYPE_LABELS[ticket.type]} for ${ticket.flatNumber}, ${ticket.societyName}`,
          type: "success",
        });
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't create ticket",
          description: error.message,
          type: "error",
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.devices.getAnomalies.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.devices.getFleet.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.serviceOps.getBoard.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.serviceOps.getSlaStats.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.serviceOps.getAreaDemand.queryKey() });
      },
    })
  );
};
