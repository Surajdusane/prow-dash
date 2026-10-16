"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { leadSourceLabel } from "@/features/leads/utils";
import { useTRPC } from "@/trpc/client";

/**
 * Adds a lead to the top of the pipeline. Invalidates every leads query so the
 * KPI row, funnel, source chart and table all move together.
 */
export const useCreateLead = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.leads.create.mutationOptions({
      onSuccess: (lead) => {
        toastManager.add({
          title: "Lead added",
          description: `${lead.name}${lead.societyName ? ` · ${lead.societyName}` : ""} · ${leadSourceLabel(lead.source ?? "unknown")}`,
          type: "success",
        });
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't add lead",
          description: error.message,
          type: "error",
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.leads.getKpis.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.leads.getFunnel.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.leads.getBySource.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.leads.getList.queryKey() });
      },
    })
  );
};
