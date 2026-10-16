"use client";

import { Suspense } from "react";

import { AssignTicketDialog } from "@/features/service-ops/components/assign-ticket-dialog";
import { CreateTicketDialog } from "@/features/service-ops/components/create-ticket-dialog";

/**
 * Store-driven dialogs for the Service Ops route. Mounted once at page level;
 * the board, header and predictive table only flip store state to open them.
 */
export function ServiceOpsDialogs() {
  return (
    <Suspense fallback={null}>
      <CreateTicketDialog />
      <AssignTicketDialog />
    </Suspense>
  );
}
