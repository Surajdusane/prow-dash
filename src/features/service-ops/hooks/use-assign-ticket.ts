"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import type { BoardTicket, TechnicianWorkloadRow } from "@/db/queries/tickets";
import { useTRPC } from "@/trpc/client";

/**
 * Assigns (or unassigns) a technician. Optimistic: the card moves columns
 * immediately by patching the board cache; rolls back on failure.
 */
export const useAssignTicket = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.serviceOps.assign.mutationOptions({
      onMutate: async (input) => {
        const boardKey = trpc.serviceOps.getBoard.queryKey();
        await queryClient.cancelQueries({ queryKey: boardKey });
        const snapshot = queryClient.getQueriesData<BoardTicket[]>({ queryKey: boardKey });

        const workload = queryClient.getQueryData<TechnicianWorkloadRow[]>(
          trpc.serviceOps.getTechnicianWorkload.queryKey()
        );
        // `z.coerce.number()` makes the client-side input type `unknown` — the
        // dialog only ever passes a real id or null.
        const technicianId = input.technicianId as number | null;
        const technicianName =
          technicianId === null
            ? null
            : (workload?.find((row) => row.technicianId === technicianId)?.technicianName ?? null);

        queryClient.setQueriesData<BoardTicket[]>({ queryKey: boardKey }, (tickets) =>
          tickets?.map((ticket) => (ticket.id === input.id ? { ...ticket, technicianId, technicianName } : ticket))
        );

        return { snapshot };
      },
      onError: (error, _input, context) => {
        context?.snapshot.forEach(([key, tickets]) => queryClient.setQueryData(key, tickets));
        toastManager.add({
          title: "Couldn't assign technician",
          description: error.message,
          type: "error",
        });
      },
      onSuccess: (ticket) => {
        toastManager.add({
          title: ticket.technicianName ? "Technician assigned" : "Assignment cleared",
          description: ticket.technicianName
            ? `#${ticket.id} → ${ticket.technicianName}`
            : `#${ticket.id} is back in the unassigned queue`,
          type: "success",
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.serviceOps.getBoard.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.serviceOps.getTechnicianWorkload.queryKey() });
      },
    })
  );
};
