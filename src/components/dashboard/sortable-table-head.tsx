"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Sortable column header, generic over the server's sort-key union. Sorting
 * runs server-side — clicking only flips the `sort`/`dir` input keys, so the
 * table keeps its current rows while the next ordering loads.
 */
export function SortableTableHead<T extends string>({
  label,
  column,
  activeColumn,
  direction,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  column: T;
  activeColumn: T;
  direction: "asc" | "desc";
  onSort: (column: T) => void;
  align?: "left" | "right";
  className?: string;
}): React.ReactElement {
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
