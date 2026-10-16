"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HouseholdStatus } from "@/db/queries/customers";
import type { RiskBand } from "@/db/queries/risk";
import { useGetAreaOptions } from "@/features/customers/hooks";
import { HOUSEHOLD_STATUS_LABELS, RISK_BAND_LABELS, type RiskTableState } from "@/features/customers/utils";

/** Sentinel for "no filter applied" — Base UI Select needs a concrete value. */
const ALL = "all";

const BAND_ITEMS = [
  { value: ALL, label: "All risk bands" },
  ...(Object.keys(RISK_BAND_LABELS) as RiskBand[]).map((band) => ({ value: band, label: RISK_BAND_LABELS[band] })),
];

const STATUS_ITEMS = [
  { value: ALL, label: "All statuses" },
  ...(Object.keys(HOUSEHOLD_STATUS_LABELS) as HouseholdStatus[]).map((status) => ({
    value: status,
    label: HOUSEHOLD_STATUS_LABELS[status],
  })),
];

/**
 * Risk table filters. Every change flows through the parent as a patch so it
 * can reset paging — a filter change always jumps back to page 1.
 */
export function RiskTableToolbar({
  state,
  onChange,
}: {
  state: RiskTableState;
  onChange: (patch: Partial<RiskTableState>) => void;
}) {
  const { data: areas } = useGetAreaOptions();

  const areaItems = [
    { value: ALL, label: "All areas" },
    ...areas.map((area) => ({ value: String(area.id), label: area.name })),
  ];
  const hasFilters = state.riskBand !== undefined || state.areaId !== undefined || state.status !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={BAND_ITEMS}
        value={state.riskBand ?? ALL}
        onValueChange={(value) => {
          if (value === null) return;
          onChange({ riskBand: value === ALL ? undefined : (value as RiskBand) });
        }}
      >
        <SelectTrigger aria-label="Filter by risk band" className="min-w-36 sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {BAND_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>

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
        items={STATUS_ITEMS}
        value={state.status ?? ALL}
        onValueChange={(value) => {
          if (value === null) return;
          onChange({ status: value === ALL ? undefined : (value as HouseholdStatus) });
        }}
      >
        <SelectTrigger aria-label="Filter by household status" className="min-w-36 sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {STATUS_ITEMS.map((item) => (
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
        onClick={() => onChange({ riskBand: undefined, areaId: undefined, status: undefined })}
      >
        <RotateCcw />
        Reset
      </Button>
    </div>
  );
}
