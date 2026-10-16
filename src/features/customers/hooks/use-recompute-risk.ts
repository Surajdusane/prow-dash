"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { useTRPC } from "@/trpc/client";

/**
 * Recomputes `riskScore` for the whole book (or one household). Invalidates
 * every risk-shaped query so the table visibly re-sorts once the new scores
 * land.
 */
export const useRecomputeRisk = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.customers.recomputeRisk.mutationOptions({
      onSuccess: (count) => {
        toastManager.add({
          title: "Risk scores recomputed",
          description:
            count === 0
              ? "No households matched the recompute."
              : `${count.toLocaleString("en-IN")} households rescored from the last 90 days of signals.`,
          type: "success",
        });
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't recompute risk",
          description: error.message,
          type: "error",
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.customers.getRiskTable.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.customers.getRiskDistribution.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.customers.getKpis.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.customers.getById.queryKey() });
      },
    })
  );
};
