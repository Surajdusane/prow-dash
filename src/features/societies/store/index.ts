"use client";

import { create } from "zustand";

/**
 * Cross-section UI state for the Societies route: a table row opens the
 * society drawer. A tiny store keeps that trigger decoupled from the drawer.
 */
type SocietiesUiState = {
  /** Society whose drawer is open, if any. */
  selectedSocietyId: number | null;
  openSociety: (societyId: number) => void;
  closeSociety: () => void;
};

export const useSocietiesUiStore = create<SocietiesUiState>()((set) => ({
  selectedSocietyId: null,
  openSociety: (societyId) => set({ selectedSocietyId: societyId }),
  closeSociety: () => set({ selectedSocietyId: null }),
}));
