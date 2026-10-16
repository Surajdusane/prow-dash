"use client";

import { AddComplaintDialog } from "@/features/customers/components/household-drawer/add-complaint-dialog";
import { HouseholdDrawer } from "@/features/customers/components/household-drawer/household-drawer";

/**
 * Store-driven overlays for the Customers route. Mounted once at page level:
 * the risk table only flips store state to open the drawer, and the drawer
 * opens the add-complaint dialog from its footer.
 */
export function CustomersDialogs() {
  return (
    <>
      <HouseholdDrawer />
      <AddComplaintDialog />
    </>
  );
}
