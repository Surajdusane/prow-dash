"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLeadsUiStore } from "@/features/leads/store";

/** Page-header action that opens the create-lead dialog via the store. */
export function CreateLeadButton() {
  const openCreate = useLeadsUiStore((state) => state.openCreate);

  return (
    <Button onClick={openCreate}>
      <Plus />
      Add lead
    </Button>
  );
}
