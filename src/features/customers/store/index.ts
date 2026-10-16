"use client";

import { create } from "zustand";

/**
 * Cross-section UI state for the Customers route: the table rows open the
 * household drawer, and the drawer opens the add-complaint dialog. Keeping
 * both in a tiny store lets those triggers stay decoupled from each other.
 */
type CustomersUiState = {
  /** Household whose drawer is open, if any. */
  selectedHouseholdId: number | null;
  openHousehold: (householdId: number) => void;
  closeHousehold: () => void;
  /** Household the add-complaint dialog targets, if open. */
  complaintHouseholdId: number | null;
  openAddComplaint: (householdId: number) => void;
  closeAddComplaint: () => void;
};

export const useCustomersUiStore = create<CustomersUiState>()((set) => ({
  selectedHouseholdId: null,
  openHousehold: (householdId) => set({ selectedHouseholdId: householdId }),
  closeHousehold: () => set({ selectedHouseholdId: null }),
  complaintHouseholdId: null,
  openAddComplaint: (householdId) => set({ complaintHouseholdId: householdId }),
  closeAddComplaint: () => set({ complaintHouseholdId: null }),
}));
