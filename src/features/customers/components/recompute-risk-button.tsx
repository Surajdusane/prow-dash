"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRecomputeRisk } from "@/features/customers/hooks";
import { confirm } from "@/hooks/use-confirm";

/**
 * Global risk recompute - re-scores every household from the last 90 days of
 * complaints, payments and SLA misses. Confirmed first because it rewrites the
 * whole book; the table visibly re-sorts once the mutation lands.
 */
export function RecomputeRiskButton() {
  const recompute = useRecomputeRisk();

  const handleClick = async () => {
    const confirmed = await confirm({
      title: "Recompute risk for every household?",
      description:
        "Scores are rebuilt from the last 90 days of complaints, late payments and SLA misses. Existing scores are overwritten and the risk table will re-sort.",
      confirmText: "Recompute",
      variant: "default",
    });
    if (!confirmed) return;

    recompute.mutate({});
  };

  return (
    <Button variant="outline" disabled={recompute.isPending} onClick={handleClick}>
      {recompute.isPending ? <Spinner /> : <RefreshCw />}
      Recompute risk
    </Button>
  );
}
