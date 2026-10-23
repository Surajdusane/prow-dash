"use client";

import { create } from "zustand";

import type { BoardTicket } from "@/db/queries/tickets";

/**
 * Cross-section UI state for the Service Ops route: the create dialog is opened
 * from the page header and the predictive table, while the assign dialog is
 * opened by the board - a tiny store keeps those triggers decoupled.
 */
type ServiceOpsUiState = {
  isCreateOpen: boolean;
  createHouseholdId: number | null;
  openCreateTicket: (householdId?: number) => void;
  closeCreateTicket: () => void;
  pendingAssignTicket: BoardTicket | null;
  openAssignDialog: (ticket: BoardTicket) => void;
  closeAssignDialog: () => void;
};

export const useServiceOpsUiStore = create<ServiceOpsUiState>()((set) => ({
  isCreateOpen: false,
  createHouseholdId: null,
  openCreateTicket: (householdId) => set({ isCreateOpen: true, createHouseholdId: householdId ?? null }),
  closeCreateTicket: () => set({ isCreateOpen: false, createHouseholdId: null }),
  pendingAssignTicket: null,
  openAssignDialog: (ticket) => set({ pendingAssignTicket: ticket }),
  closeAssignDialog: () => set({ pendingAssignTicket: null }),
}));
