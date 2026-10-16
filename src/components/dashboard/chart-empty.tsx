import type React from "react";

import { ChartLine } from "lucide-react";

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/**
 * Shared empty state for chart cards. Sized to sit inside a fixed-height chart
 * container so a card without data keeps the same footprint as a rendered one.
 */
export function ChartEmpty({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <Empty className={cn("h-full min-h-44 py-10 md:py-10", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon ?? <ChartLine />}</EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
    </Empty>
  );
}
