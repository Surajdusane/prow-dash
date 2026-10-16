"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { TableHead } from "@/components/ui/table";
import type { RiskSort } from "@/db/queries/customers";
import { cn } from "@/lib/utils";

/**
 * Sortable column header. Sorting runs server-side — clicking only flips the
 * `sort`/`dir` input keys, so the table keeps its current rows while the next
 * ordering loads.
 */
export function SortableTableHead({
  label,
  column,
  activeColumn,
  direction,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  column: RiskSort;
  activeColumn: RiskSort;
  direction: "asc" | "desc";
  onSort: (column: RiskSort) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = column === activeColumn;
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "hover:text-foreground flex w-full items-center gap-1 transition-colors",
          align === "right" ? "justify-end" : "justify-start",
          active && "text-foreground"
        )}
      >
        {label}
        <Icon className={cn("size-3.5 shrink-0", !active && "opacity-40")} />
      </button>
    </TableHead>
  );
}
