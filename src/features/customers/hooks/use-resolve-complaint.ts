"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { useTRPC } from "@/trpc/client";

/** Resolves a complaint (idempotent) and refreshes the household history. */
export const useResolveComplaint = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.customers.resolveComplaint.mutationOptions({
      onSuccess: (complaint) => {
        toastManager.add({
          title: "Complaint resolved",
          description: `#${complaint.id} closed${complaint.resolutionDate ? ` on ${complaint.resolutionDate}` : ""}.`,
          type: "success",
        });
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't resolve complaint",
          description: error.message,
          type: "error",
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.customers.getById.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.customers.getRiskTable.queryKey() });
      },
    })
  );
};
