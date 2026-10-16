"use client";

import { useEffect, useRef, useState } from "react";

import { X } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { LeadListRow } from "@/db/queries/leads";
import { useUpdateLead } from "@/features/leads/hooks";
import { useLeadsUiStore } from "@/features/leads/store";
import { leadSourceLabel } from "@/features/leads/utils";

/**
 * Edit-lead dialog: sets or clears the visit date and toggles conversion with
 * a flats count. Opened from the leads table; the store hands it the row
 * snapshot, and the content outlives the close animation.
 */
export function EditLeadDialog() {
  const editingLead = useLeadsUiStore((state) => state.editingLead);
  const close = useLeadsUiStore((state) => state.closeEdit);
  const update = useUpdateLead();

  const open = editingLead !== null;
  // Keep the last non-null lead so the content survives the exit animation.
  const [lead, setLead] = useState<LeadListRow | null>(null);
  const [visitDate, setVisitDate] = useState("");
  const [converted, setConverted] = useState(false);
  const [flats, setFlats] = useState("1");
  const wasOpen = useRef(false);

  // Reset on the closed → open transition so the previous edit never leaks in.
  useEffect(() => {
    if (open && !wasOpen.current && editingLead) {
      setLead(editingLead);
      setVisitDate(editingLead.visitDate ?? "");
      setConverted(editingLead.converted);
      setFlats(String(editingLead.flatsConverted && editingLead.flatsConverted > 0 ? editingLead.flatsConverted : 1));
    }
    wasOpen.current = open;
  }, [open, editingLead]);

  const handleSubmit = () => {
    if (!lead) return;

    const flatsValue = Math.min(100, Math.max(0, Math.round(Number(flats) || 0)));
    update.mutate(
      {
        id: lead.id,
        visitDate: visitDate.length > 0 ? visitDate : null,
        converted,
        flatsConverted: converted ? flatsValue : 0,
      },
      { onSuccess: () => close() }
    );
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
          <DialogTitle>Edit lead</DialogTitle>
          <DialogDescription>
            {lead
              ? `${lead.name}${lead.societyName ? ` · ${lead.societyName}` : ""} · ${leadSourceLabel(lead.source ?? "unknown")}`
              : "Update this lead's funnel stage."}
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-lead-visit" className="text-sm font-medium">
              Visit date
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="edit-lead-visit"
                type="date"
                value={visitDate}
                onChange={(event) => setVisitDate(event.target.value)}
              />
              {visitDate.length > 0 ? (
                <Button variant="ghost" size="icon-sm" aria-label="Clear visit date" onClick={() => setVisitDate("")}>
                  <X />
                </Button>
              ) : null}
            </div>
            <p className="text-muted-foreground text-xs">Leave empty for leads that haven&apos;t visited yet.</p>
          </div>

          <div className="border-border flex items-center justify-between gap-4 rounded-xl border p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Converted</span>
              <span className="text-muted-foreground text-xs">Mark when the lead signs up households.</span>
            </div>
            <Switch checked={converted} onCheckedChange={(checked) => setConverted(checked)} aria-label="Converted" />
          </div>

          {converted ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="edit-lead-flats" className="text-sm font-medium">
                Flats converted
              </label>
              <Input
                id="edit-lead-flats"
                type="number"
                min={0}
                max={100}
                value={flats}
                onChange={(event) => setFlats(event.target.value)}
              />
            </div>
          ) : null}
        </DialogPanel>

        <DialogFooter>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button loading={update.isPending} onClick={handleSubmit}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
