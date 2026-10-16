"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import type { BoardTicket } from "@/db/queries/tickets";
import { TICKET_STATUS_LABELS, todayKey } from "@/features/service-ops/utils";
import { useTRPC } from "@/trpc/client";

/**
 * Moves a ticket between statuses (kanban drops, drawer actions). Optimistic:
 * the board updates immediately and rolls back to a snapshot on failure.
 */
export const useUpdateTicketStatus = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.serviceOps.updateStatus.mutationOptions({
      onMutate: async (input) => {
        const boardKey = trpc.serviceOps.getBoard.queryKey();
        await queryClient.cancelQueries({ queryKey: boardKey });
        const snapshot = queryClient.getQueriesData<BoardTicket[]>({ queryKey: boardKey });

        queryClient.setQueriesData<BoardTicket[]>({ queryKey: boardKey }, (tickets) =>
          tickets?.map((ticket) =>
            ticket.id === input.id
              ? {
                  ...ticket,
                  status: input.status,
                  resolvedDate: input.status === "resolved" ? todayKey() : null,
                  slaMet: input.status === "resolved" ? ticket.slaMet : null,
                }
              : ticket
          )
        );

        return { snapshot };
      },
      onError: (error, _input, context) => {
        context?.snapshot.forEach(([key, tickets]) => queryClient.setQueryData(key, tickets));
        toastManager.add({
          title: "Couldn't update ticket",
          description: error.message,
          type: "error",
        });
      },
      onSuccess: (ticket, input) => {
        toastManager.add({
          title: input.status === "resolved" ? "Ticket resolved" : "Ticket updated",
          description: `#${ticket.id} · ${TICKET_STATUS_LABELS[ticket.status]}`,
          type: "success",
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.serviceOps.getBoard.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.serviceOps.getSlaStats.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.serviceOps.getTechnicianWorkload.queryKey() });
      },
    })
  );
};
