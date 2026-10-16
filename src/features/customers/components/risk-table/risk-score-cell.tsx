"use client";

import { Badge } from "@/components/ui/badge";
import { RISK_BAND_SWATCHES, riskBandBadgeVariant, riskBandOf } from "@/features/customers/utils";
import { cn } from "@/lib/utils";

/** Risk score as a mini progress bar plus a band-colored badge (0–100). */
export function RiskScoreCell({ score, className }: { score: number; className?: string }) {
  const band = riskBandOf(score);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span aria-hidden className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
        <span
          className={cn("block h-full rounded-full", RISK_BAND_SWATCHES[band])}
          style={{ width: `${Math.max(score, 2)}%` }}
        />
      </span>
      <Badge size="sm" variant={riskBandBadgeVariant(band)}>
        {score}
      </Badge>
    </div>
  );
}
