"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useServiceOpsUiStore } from "@/features/service-ops/store";

/** Page-header action that opens the create-ticket dialog. */
export function CreateTicketButton() {
  const openCreateTicket = useServiceOpsUiStore((state) => state.openCreateTicket);

  return (
    <Button onClick={() => openCreateTicket()}>
      <Plus />
      New ticket
    </Button>
  );
}
