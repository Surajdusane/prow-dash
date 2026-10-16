"use client";

import { useEffect, useMemo, useState } from "react";

import { MapPin, RotateCcw, Search, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useGetAreaDemand } from "@/features/service-ops/hooks";
import { TICKET_TYPE_LABELS, TICKET_TYPES } from "@/features/service-ops/utils";
import type { GetBoardInput } from "@/trpc/schema";

const ALL = "all";
const SEARCH_DEBOUNCE_MS = 300;

/** Single-row toolbar for the kanban board: search, type/area filters, reset. */
export function BoardFilters({
  filters,
  onChange,
  isFetching,
}: {
  filters: GetBoardInput;
  onChange: (filters: GetBoardInput) => void;
  isFetching: boolean;
}) {
  const { data: areas } = useGetAreaDemand();
  const [search, setSearch] = useState(filters.search ?? "");

  // Debounce free-text search so every keystroke doesn't hit the server.
  useEffect(() => {
    const handle = setTimeout(() => {
      const trimmed = search.trim();
      if ((filters.search ?? "") === trimmed) return;
      onChange({ ...filters, search: trimmed.length > 0 ? trimmed : undefined });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [search, filters, onChange]);

  const typeItems = useMemo(
    () => [
      { value: ALL, label: "All types" },
      ...TICKET_TYPES.map((type) => ({ value: type, label: TICKET_TYPE_LABELS[type] })),
    ],
    []
  );

  const areaItems = useMemo(
    () => [
      { value: ALL, label: "All areas" },
      ...areas.map((area) => ({ value: String(area.areaId), label: area.area })),
    ],
    [areas]
  );

  const hasActiveFilters =
    filters.type !== undefined ||
    filters.areaId !== undefined ||
    filters.search !== undefined ||
    search.trim().length > 0;

  const handleReset = () => {
    setSearch("");
    onChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 basis-56">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 opacity-70"
        />
        <Input
          type="search"
          size="sm"
          className="ps-8"
          placeholder="Search flat, resident or society…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <Select
        items={typeItems}
        value={filters.type ?? ALL}
        onValueChange={(value) =>
          onChange({ ...filters, type: value === ALL ? undefined : (value as GetBoardInput["type"]) })
        }
      >
        <SelectTrigger size="sm" aria-label="Filter by ticket type" className="w-auto min-w-36">
          <Wrench aria-hidden className="text-muted-foreground size-3.5 shrink-0 opacity-70" />
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {typeItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>

      <Select
        items={areaItems}
        value={filters.areaId === undefined ? ALL : String(filters.areaId)}
        onValueChange={(value) => onChange({ ...filters, areaId: value === ALL ? undefined : Number(value) })}
      >
        <SelectTrigger size="sm" aria-label="Filter by area" className="w-auto min-w-40">
          <MapPin aria-hidden className="text-muted-foreground size-3.5 shrink-0 opacity-70" />
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

      {hasActiveFilters ? (
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw />
          Reset
        </Button>
      ) : null}

      {/* Fixed-width slot keeps the row stable when the refetch spinner appears. */}
      <span className="flex w-4 shrink-0 items-center justify-center">
        {isFetching ? <Spinner aria-label="Refreshing results" className="text-muted-foreground size-3.5" /> : null}
      </span>
    </div>
  );
}
