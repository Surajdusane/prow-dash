"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { COMPLAINT_CATEGORY_LABELS, COMPLAINT_SEVERITY_LABELS } from "@/features/customers/utils";
import { useTRPC } from "@/trpc/client";

/** Logs a complaint against a household and refreshes its history + the trend. */
export const useCreateComplaint = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.customers.createComplaint.mutationOptions({
      onSuccess: (complaint) => {
        toastManager.add({
          title: "Complaint logged",
          description: `${COMPLAINT_CATEGORY_LABELS[complaint.category]} · ${COMPLAINT_SEVERITY_LABELS[complaint.severity].toLowerCase()} severity`,
          type: "success",
        });
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't log complaint",
          description: error.message,
          type: "error",
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.customers.getById.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.customers.getComplaintTrend.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.customers.getRiskTable.queryKey() });
      },
    })
  );
};
