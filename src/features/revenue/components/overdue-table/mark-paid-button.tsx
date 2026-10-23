"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMarkPaid } from "@/features/revenue/hooks";

/**
 * Marks one late/failed payment as paid today. Only the clicked row's button
 * spins - `variables` pins the pending state to the payment being mutated.
 */
export function MarkPaidButton({ paymentId }: { paymentId: number }): React.ReactElement {
  const markPaid = useMarkPaid();
  const isPending = markPaid.isPending && markPaid.variables?.paymentId === paymentId;

  return (
    <Button variant="outline" size="xs" loading={isPending} onClick={() => markPaid.mutate({ paymentId })}>
      <Check />
      Mark paid
    </Button>
  );
}
