"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import type { BoardTicket } from "@/db/queries/tickets";
import { useTRPC } from "@/trpc/client";

/** Deletes a ticket. Optimistic: the card disappears immediately, rolls back on failure. */
export const useRemoveTicket = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.serviceOps.remove.mutationOptions({
      onMutate: async (input) => {
        const boardKey = trpc.serviceOps.getBoard.queryKey();
        await queryClient.cancelQueries({ queryKey: boardKey });
        const snapshot = queryClient.getQueriesData<BoardTicket[]>({ queryKey: boardKey });

        queryClient.setQueriesData<BoardTicket[]>({ queryKey: boardKey }, (tickets) =>
          tickets?.filter((ticket) => ticket.id !== input.id)
        );

        return { snapshot };
      },
      onError: (error, _input, context) => {
        context?.snapshot.forEach(([key, tickets]) => queryClient.setQueryData(key, tickets));
        toastManager.add({
          title: "Couldn't delete ticket",
          description: error.message,
          type: "error",
        });
      },
      onSuccess: (_ticket, input) => {
        toastManager.add({
          title: "Ticket deleted",
          description: `#${input.id} was removed from the board.`,
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
