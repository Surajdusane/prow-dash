"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DispenserType } from "@/db/queries/devices";
import { useGetAreaOptions } from "@/features/devices/hooks";
import { DISPENSER_TYPE_LABELS, type FleetTableState } from "@/features/devices/utils";

/** Sentinel for "no filter applied" - Base UI Select needs a concrete value. */
const ALL = "all";

const TYPE_ITEMS = [
  { value: ALL, label: "All types" },
  ...(Object.keys(DISPENSER_TYPE_LABELS) as DispenserType[]).map((type) => ({
    value: type,
    label: DISPENSER_TYPE_LABELS[type],
  })),
];

const ONLINE_ITEMS = [
  { value: ALL, label: "Any connectivity" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

/**
 * Fleet table filters. Every change flows through the parent as a patch so it
 * can reset paging - a filter change always jumps back to page 1.
 */
export function FleetTableToolbar({
  state,
  onChange,
}: {
  state: FleetTableState;
  onChange: (patch: Partial<FleetTableState>) => void;
}) {
  const { data: areas } = useGetAreaOptions();

  const areaItems = [
    { value: ALL, label: "All areas" },
    ...areas.map((area) => ({ value: String(area.id), label: area.name })),
  ];
  const hasFilters = state.areaId !== undefined || state.type !== undefined || state.online !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={areaItems}
        value={state.areaId === undefined ? ALL : String(state.areaId)}
        onValueChange={(value) => {
          if (value === null) return;
          onChange({ areaId: value === ALL ? undefined : Number(value) });
        }}
      >
        <SelectTrigger aria-label="Filter by area" className="min-w-36 sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {areaItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>

      <Select
        items={TYPE_ITEMS}
        value={state.type ?? ALL}
        onValueChange={(value) => {
          if (value === null) return;
          onChange({ type: value === ALL ? undefined : (value as DispenserType) });
        }}
      >
        <SelectTrigger aria-label="Filter by dispenser type" className="min-w-36 sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {TYPE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>

      <Select
        items={ONLINE_ITEMS}
        value={state.online === undefined ? ALL : state.online ? "online" : "offline"}
        onValueChange={(value) => {
          if (value === null) return;
          onChange({ online: value === ALL ? undefined : value === "online" });
        }}
      >
        <SelectTrigger aria-label="Filter by connectivity" className="min-w-36 sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {ONLINE_ITEMS.map((item) => (
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
        onClick={() => onChange({ areaId: undefined, type: undefined, online: undefined })}
      >
        <RotateCcw />
        Reset
      </Button>
    </div>
  );
}
