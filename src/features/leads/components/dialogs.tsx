"use client";

import { CreateLeadDialog } from "@/features/leads/components/create-lead-dialog";
import { EditLeadDialog } from "@/features/leads/components/edit-lead-dialog";

/**
 * Store-driven dialogs for the Leads route. Mounted once at page level; the
 * header button and the table only flip store state to open them.
 */
export function LeadsDialogs() {
  return (
    <>
      <CreateLeadDialog />
      <EditLeadDialog />
    </>
  );
}
