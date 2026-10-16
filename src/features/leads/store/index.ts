"use client";

import { create } from "zustand";

import type { LeadListRow } from "@/db/queries/leads";

/**
 * Cross-section UI state for the Leads route: the header's add button opens
 * the create dialog, and table rows open the edit dialog for that lead. A tiny
 * store keeps those triggers decoupled from the dialogs.
 */
type LeadsUiState = {
  isCreateOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
  /** Lead the edit dialog targets, if open. */
  editingLead: LeadListRow | null;
  openEdit: (lead: LeadListRow) => void;
  closeEdit: () => void;
};

export const useLeadsUiStore = create<LeadsUiState>()((set) => ({
  isCreateOpen: false,
  openCreate: () => set({ isCreateOpen: true }),
  closeCreate: () => set({ isCreateOpen: false }),
  editingLead: null,
  openEdit: (lead) => set({ editingLead: lead }),
  closeEdit: () => set({ editingLead: null }),
}));
