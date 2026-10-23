"use client";

import { RISK_BAND_STROKES, RISK_BAND_TEXT, riskBandOf } from "@/features/customers/utils";
import { cn } from "@/lib/utils";

/** Compact risk dial - band-colored progress ring with the 0–100 score in the middle. */
export function RiskRing({ score, className }: { score: number; className?: string }) {
  const band = riskBandOf(score);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="relative size-16">
        <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden>
          <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="6" className="stroke-muted" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={RISK_BAND_STROKES[band]}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <span
          className={cn(
            "font-heading absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums",
            RISK_BAND_TEXT[band]
          )}
        >
          {score}
        </span>
      </div>
      <span className="text-muted-foreground text-[10px] tracking-wide uppercase">Risk score</span>
    </div>
  );
}
