"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { formatInr, formatMonth } from "@/lib/format";
import { useTRPC } from "@/trpc/client";

/**
 * Marks an overdue payment as paid today. Invalidates every revenue query so
 * the KPI row, payment-status chart and overdue list all move together.
 */
export const useMarkPaid = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.revenue.markPaid.mutationOptions({
      onSuccess: (payment) => {
        toastManager.add({
          title: "Payment marked paid",
          description: `${payment.residentName} · flat ${payment.flatNumber} · ${formatMonth(payment.billingMonth)} · ${formatInr(payment.amount)} collected.`,
          type: "success",
        });
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't mark payment paid",
          description: error.message,
          type: "error",
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.revenue.getKpis.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.revenue.getPaymentStatusByMonth.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.revenue.getOverdue.queryKey() });
      },
    })
  );
};
