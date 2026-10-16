"use client";

import { useEffect, useState } from "react";

import { RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetAreaPenetration } from "@/features/societies/hooks";
import type { SocietyTableState } from "@/features/societies/utils";

/** Sentinel for "no filter applied" — Base UI Select needs a concrete value. */
const ALL = "all";
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Society table filters. Search is debounced so typing never fires a request
 * per keystroke; every change flows through the parent as a patch so it can
 * reset paging.
 */
export function SocietyTableToolbar({
  state,
  onChange,
}: {
  state: SocietyTableState;
  onChange: (patch: Partial<SocietyTableState>) => void;
}) {
  const { data: areas } = useGetAreaPenetration();
  const [search, setSearch] = useState(state.search ?? "");

  const areaItems = [
    { value: ALL, label: "All areas" },
    ...areas.map((area) => ({ value: String(area.areaId), label: area.area })),
  ];
  const hasFilters = state.areaId !== undefined || state.search !== undefined;

  // Debounce keystrokes into one server round-trip; typed text lives locally
  // so the table never refetches per character. The only external way filters
  // change is this toolbar's own reset, which clears this input too.
  useEffect(() => {
    const trimmed = search.trim();
    const next = trimmed.length > 0 ? trimmed : undefined;
    if (next === state.search) return;

    const timer = setTimeout(() => onChange({ search: next }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, state.search, onChange]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <InputGroup className="w-56">
        <InputGroupAddon>
          <InputGroupText>
            <Search />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={search}
          placeholder="Search societies"
          aria-label="Search societies"
          onChange={(event) => setSearch(event.target.value)}
        />
      </InputGroup>

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

      <Button
        variant="ghost"
        size="sm"
        disabled={!hasFilters}
        onClick={() => {
          setSearch("");
          onChange({ areaId: undefined, search: undefined });
        }}
      >
        <RotateCcw />
        Reset
      </Button>
    </div>
  );
}
