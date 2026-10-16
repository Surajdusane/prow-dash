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
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useCreateLead } from "@/features/leads/hooks";
import { useLeadsUiStore } from "@/features/leads/store";
import { LEAD_ROLE_LABELS, LEAD_ROLES, LEAD_SOURCES, leadSourceLabel } from "@/features/leads/utils";

/** Sentinel for "no role" — the role is optional, but Select needs a concrete value. */
const NO_ROLE = "none";

const roleItems = [
  { value: NO_ROLE, label: "No role" },
  ...LEAD_ROLES.map((role) => ({ value: role, label: LEAD_ROLE_LABELS[role] })),
];
const sourceItems = LEAD_SOURCES.map((source) => ({ value: source, label: leadSourceLabel(source) }));

/**
 * Create-lead dialog. Opened from the page header; only the name and channel
 * are required, everything else can stay blank.
 */
export function CreateLeadDialog() {
  const open = useLeadsUiStore((state) => state.isCreateOpen);
  const close = useLeadsUiStore((state) => state.closeCreate);
  const create = useCreateLead();

  const [name, setName] = useState("");
  const [societyName, setSocietyName] = useState("");
  const [role, setRole] = useState<string>(NO_ROLE);
  const [source, setSource] = useState<string>(LEAD_SOURCES[0]);
  const wasOpen = useRef(false);

  // Reset on the closed → open transition so a previous attempt never leaks in.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setName("");
      setSocietyName("");
      setRole(NO_ROLE);
      setSource(LEAD_SOURCES[0]);
    }
    wasOpen.current = open;
  }, [open]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const trimmedSociety = societyName.trim();
    create.mutate(
      {
        name: trimmedName,
        source,
        ...(trimmedSociety ? { societyName: trimmedSociety } : {}),
        ...(role !== NO_ROLE ? { role: role as (typeof LEAD_ROLES)[number] } : {}),
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
          <DialogTitle>Add lead</DialogTitle>
          <DialogDescription>Record an inbound prospect so the pipeline reflects every enquiry.</DialogDescription>
        </DialogHeader>

        <DialogPanel className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="create-lead-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="create-lead-name"
              value={name}
              placeholder="e.g. Ananya Rao"
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="create-lead-society" className="text-sm font-medium">
              Society <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              id="create-lead-society"
              value={societyName}
              placeholder="e.g. Prestige Lakeside"
              onChange={(event) => setSocietyName(event.target.value)}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Role</span>
              <Select items={roleItems} value={role} onValueChange={(value) => setRole(value ?? NO_ROLE)}>
                <SelectTrigger aria-label="Lead role">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {roleItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Source</span>
              <Select items={sourceItems} value={source} onValueChange={(value) => setSource(value ?? LEAD_SOURCES[0])}>
                <SelectTrigger aria-label="Lead source">
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
            </div>
          </div>
        </DialogPanel>

        <DialogFooter>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || create.isPending} onClick={handleSubmit}>
            {create.isPending ? (
              <>
                <Spinner />
                Adding…
              </>
            ) : (
              "Add lead"
            )}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
