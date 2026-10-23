"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetLeadsBySource } from "@/features/leads/hooks";
import { leadSourceLabel, type LeadsTableState } from "@/features/leads/utils";

/** Sentinel for "no filter applied" - Base UI Select needs a concrete value. */
const ALL = "all";
const CONVERTED_ITEMS = [
  { value: ALL, label: "All leads" },
  { value: "converted", label: "Converted" },
  { value: "not_converted", label: "Not converted" },
];

/**
 * Leads table filters. Every change flows through the parent as a patch so it
 * can reset paging - a filter change always jumps back to page 1.
 */
export function LeadsTableToolbar({
  state,
  onChange,
}: {
  state: LeadsTableState;
  onChange: (patch: Partial<LeadsTableState>) => void;
}) {
  const { data: bySource } = useGetLeadsBySource();

  const sourceItems = [
    { value: ALL, label: "All sources" },
    ...bySource.map((row) => ({ value: row.source, label: leadSourceLabel(row.source) })),
  ];
  const convertedValue = state.converted === undefined ? ALL : state.converted ? "converted" : "not_converted";
  const hasFilters = state.source !== undefined || state.converted !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={sourceItems}
        value={state.source ?? ALL}
        onValueChange={(value) => {
          if (value === null) return;
          onChange({ source: value === ALL ? undefined : value });
        }}
      >
        <SelectTrigger aria-label="Filter by source" className="min-w-36 sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {sourceItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>

      <Select
        items={CONVERTED_ITEMS}
        value={convertedValue}
        onValueChange={(value) => {
          if (value === null) return;
          onChange({
            converted: value === ALL ? undefined : value === "converted",
          });
        }}
      >
        <SelectTrigger aria-label="Filter by conversion status" className="min-w-36 sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {CONVERTED_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        disabled={!hasFilters}
        onClick={() => onChange({ source: undefined, converted: undefined })}
      >
        <RotateCcw />
        Reset
      </Button>
    </div>
  );
}
