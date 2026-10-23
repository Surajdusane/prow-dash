"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
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
import type { ComplaintCategory, ComplaintSeverity } from "@/db/queries/complaints";
import { useCreateComplaint, useGetHouseholdProfile } from "@/features/customers/hooks";
import { useCustomersUiStore } from "@/features/customers/store";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_SEVERITIES,
  COMPLAINT_SEVERITY_LABELS,
} from "@/features/customers/utils";

const CATEGORY_ITEMS = COMPLAINT_CATEGORIES.map((category) => ({
  value: category,
  label: COMPLAINT_CATEGORY_LABELS[category],
}));

const SEVERITY_ITEMS = COMPLAINT_SEVERITIES.map((severity) => ({
  value: severity,
  label: COMPLAINT_SEVERITY_LABELS[severity],
}));

/**
 * Store-driven complaint dialog - opened from the household drawer footer.
 * The profile query is shared with the drawer, so the context line is warm.
 */
export function AddComplaintDialog() {
  const householdId = useCustomersUiStore((state) => state.complaintHouseholdId);
  const close = useCustomersUiStore((state) => state.closeAddComplaint);
  const { data } = useGetHouseholdProfile(householdId);
  const create = useCreateComplaint();

  const [category, setCategory] = useState<ComplaintCategory>("water_quality");
  const [severity, setSeverity] = useState<ComplaintSeverity>("medium");
  const wasOpen = useRef(false);
  const open = householdId !== null;

  // Reset on the closed → open transition so a previous attempt never leaks in.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setCategory("water_quality");
      setSeverity("medium");
    }
    wasOpen.current = open;
  }, [open]);

  const handleSubmit = () => {
    if (householdId === null) return;
    create.mutate({ householdId, category, severity }, { onSuccess: () => close() });
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
          <DialogTitle>Log a complaint</DialogTitle>
          <DialogDescription>
            {data
              ? `Against ${data.household.residentName}, flat ${data.household.flatNumber} · ${data.household.societyName}.`
              : "Against the selected household."}
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Category</span>
            <Select
              items={CATEGORY_ITEMS}
              value={category}
              onValueChange={(value) => value !== null && setCategory(value as ComplaintCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {CATEGORY_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Severity</span>
            <Select
              items={SEVERITY_ITEMS}
              value={severity}
              onValueChange={(value) => value !== null && setSeverity(value as ComplaintSeverity)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {SEVERITY_ITEMS.map((item) => (
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
          <Button disabled={householdId === null || create.isPending} onClick={handleSubmit}>
            {create.isPending ? (
              <>
                <Spinner />
                Logging…
              </>
            ) : (
              "Log complaint"
            )}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
