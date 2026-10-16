"use client";

import type React from "react";

interface ChartLegendItem {
  label: string;
  /** Tailwind background classes for the swatch, e.g. `bg-[#0284c7] dark:bg-[#38bdf8]`. */
  swatch?: string;
  /** Optional trailing value, e.g. "₹7.7L". */
  value?: string;
}

/** Small inline legend for chart card headers (evilcharts keeps legends as overlays). */
export function ChartLegend({
  items,
  className,
}: {
  items: ChartLegendItem[];
  className?: string;
}): React.ReactElement {
  return (
    <div className={className}>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 text-xs">
            {item.swatch ? <span aria-hidden className={`size-2 shrink-0 rounded-[2px] ${item.swatch}`} /> : null}
            <span className="text-muted-foreground">{item.label}</span>
            {item.value ? <span className="text-foreground font-medium tabular-nums">{item.value}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
