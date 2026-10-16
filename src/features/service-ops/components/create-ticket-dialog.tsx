"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { HouseholdLite } from "@/db/queries/service-ops";
import type { TicketType } from "@/db/queries/tickets";
import { useCreateTicket, useGetHouseholdsLite } from "@/features/service-ops/hooks";
import { useServiceOpsUiStore } from "@/features/service-ops/store";
import { TICKET_TYPE_LABELS, TICKET_TYPES } from "@/features/service-ops/utils";

const typeItems = TICKET_TYPES.map((type) => ({ value: type, label: TICKET_TYPE_LABELS[type] }));

/**
 * Create-ticket dialog. Opened from the page header (blank) or from the
 * predictive table (prefilled with the household at risk).
 */
export function CreateTicketDialog() {
  const open = useServiceOpsUiStore((state) => state.isCreateOpen);
  const prefillHouseholdId = useServiceOpsUiStore((state) => state.createHouseholdId);
  const close = useServiceOpsUiStore((state) => state.closeCreateTicket);

  const { data: households } = useGetHouseholdsLite();
  const create = useCreateTicket();

  const [household, setHousehold] = useState<HouseholdLite | null>(null);
  const [type, setType] = useState<TicketType>("filter_change");
  const wasOpen = useRef(false);

  // Reset on the closed → open transition so a previous attempt never leaks in.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setHousehold(
        prefillHouseholdId === null ? null : (households.find((item) => item.id === prefillHouseholdId) ?? null)
      );
      setType("filter_change");
    }
    wasOpen.current = open;
  }, [open, prefillHouseholdId, households]);

  const handleSubmit = () => {
    if (!household) return;
    create.mutate({ householdId: household.id, type }, { onSuccess: () => close() });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close();
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>New service ticket</DialogTitle>
          <DialogDescription>Raise a ticket against a household&apos;s dispenser.</DialogDescription>
        </DialogHeader>

        <DialogPanel className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="create-ticket-household" className="text-sm font-medium">
              Household
            </label>
            <Combobox
              items={households}
              value={household}
              onValueChange={(value) => setHousehold(value)}
              itemToStringLabel={(item) => item.label}
              isItemEqualToValue={(item, value) => item.id === value.id}
            >
              <ComboboxInput id="create-ticket-household" placeholder="Search by flat, resident or society…" />
              <ComboboxPopup>
                <ComboboxEmpty>No households match.</ComboboxEmpty>
                <ComboboxList>
                  {(item: HouseholdLite) => (
                    <ComboboxItem key={item.id} value={item}>
                      <div className="flex min-w-0 flex-col">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-muted-foreground truncate text-xs">
                          {item.residentName} · {item.societyName} · {item.areaName}
                        </span>
                      </div>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxPopup>
            </Combobox>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Ticket type</span>
            <Select items={typeItems} value={type} onValueChange={(value) => setType(value as TicketType)}>
              <SelectTrigger>
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
          </div>
        </DialogPanel>

        <DialogFooter>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button disabled={household === null || create.isPending} onClick={handleSubmit}>
            {create.isPending ? (
              <>
                <Spinner />
                Creating…
              </>
            ) : (
              "Create ticket"
            )}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
