import type { ReactNode } from "react";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardPanel } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface KpiDelta {
  /** Formatted change, e.g. "+12.4% vs last month". */
  value: string;
  /** Arrow direction. */
  direction: "up" | "down";
  /** Whether the change is good or bad. Defaults from `direction` (up = positive). */
  sentiment?: "positive" | "negative";
}

export interface KpiCardProps {
  /** Metric name, e.g. "Active households". */
  label: string;
  /** Formatted metric value. */
  value: ReactNode;
  /** Optional change indicator. */
  delta?: KpiDelta;
  /** Optional icon rendered top-right. */
  icon?: ReactNode;
  /** Optional footnote, e.g. "vs previous 30 days". */
  hint?: string;
  className?: string;
}

export function KpiCard({ label, value, delta, icon, hint, className }: KpiCardProps): React.ReactElement {
  const Arrow = delta?.direction === "down" ? ArrowDownRight : ArrowUpRight;
  const negative = delta ? (delta.sentiment ? delta.sentiment === "negative" : delta.direction === "down") : false;

  return (
    <Card className={className}>
      <CardPanel className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          {icon ? <span className="text-muted-foreground [&_svg]:size-4">{icon}</span> : null}
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {delta ? (
            <p
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                negative ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              <Arrow className="size-3.5" />
              {delta.value}
            </p>
          ) : null}
        </div>

        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </CardPanel>
    </Card>
  );
}

export function KpiCardSkeleton({ className }: { className?: string }): React.ReactElement {
  return (
    <Card className={className}>
      <CardPanel className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-4 rounded-sm" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3.5 w-20" />
        </div>

        <Skeleton className="h-3 w-32" />
      </CardPanel>
    </Card>
  );
}
