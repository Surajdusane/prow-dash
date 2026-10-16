"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { TICKET_TYPE_LABELS } from "@/features/service-ops/utils";
import { useTRPC } from "@/trpc/client";

/** Raises a ticket against a household's dispenser. */
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
        queryClient.invalidateQueries({ queryKey: trpc.serviceOps.getBoard.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.serviceOps.getSlaStats.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.serviceOps.getAreaDemand.queryKey() });
      },
    })
  );
};
