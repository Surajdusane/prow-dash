"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { formatDateKey } from "@/lib/format";
import { useTRPC } from "@/trpc/client";

/**
 * Progresses a lead through the funnel — visit date set/cleared, converted
 * toggled, flats recorded. Invalidates every leads query so the whole route
 * reflects the new stage immediately.
 */
export const useUpdateLead = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.leads.update.mutationOptions({
      onSuccess: (lead) => {
        const progression = lead.converted
          ? `Converted · ${lead.flatsConverted ?? 0} flat${(lead.flatsConverted ?? 0) === 1 ? "" : "s"}`
          : lead.visitDate
            ? `Visit ${formatDateKey(lead.visitDate)}`
            : "No visit scheduled";

        toastManager.add({
          title: "Lead updated",
          description: `${lead.name} · ${progression}`,
          type: "success",
        });
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't update lead",
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
