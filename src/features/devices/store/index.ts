"use client";

import { create } from "zustand";

/**
 * Cross-section UI state for the Devices route: the fleet table and the
 * anomaly panel both open the device drawer, so the selected dispenser lives
 * in a tiny store instead of prop-drilling through the page.
 */
type DevicesUiState = {
  /** Dispenser whose drawer is open, if any. */
  selectedDispenserId: number | null;
  openDispenser: (dispenserId: number) => void;
  closeDispenser: () => void;
};

export const useDevicesUiStore = create<DevicesUiState>()((set) => ({
  selectedDispenserId: null,
  openDispenser: (dispenserId) => set({ selectedDispenserId: dispenserId }),
  closeDispenser: () => set({ selectedDispenserId: null }),
}));
