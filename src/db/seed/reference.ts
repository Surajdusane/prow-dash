/**
 * Static reference data for the ProWater seed.
 *
 * `infrastructureAgeYears` is the deliberate lever for area-wise service
 * demand: older plumbing = siltier input water = faster filter degradation.
 * Whitefield / Electronic City / Sarjapur Road are the high-stress areas.
 */

export type AreaSeed = {
  name: string;
  latitude: number;
  longitude: number;
  infrastructureAgeYears: number;
};

export const AREA_SEEDS: readonly AreaSeed[] = [
  { name: "HSR Layout", latitude: 12.9116, longitude: 77.6412, infrastructureAgeYears: 5 },
  { name: "Whitefield", latitude: 12.9698, longitude: 77.7499, infrastructureAgeYears: 14 },
  { name: "Koramangala", latitude: 12.9352, longitude: 77.6245, infrastructureAgeYears: 4 },
  { name: "Indiranagar", latitude: 12.9784, longitude: 77.6408, infrastructureAgeYears: 3 },
  { name: "Jayanagar", latitude: 12.925, longitude: 77.5938, infrastructureAgeYears: 4 },
  { name: "Sarjapur Road", latitude: 12.901, longitude: 77.6874, infrastructureAgeYears: 10 },
  { name: "Electronic City", latitude: 12.8399, longitude: 77.677, infrastructureAgeYears: 12 },
  { name: "Hebbal", latitude: 13.0358, longitude: 77.597, infrastructureAgeYears: 6 },
] as const;

export type PlanSeed = {
  name: "starter" | "standard" | "premium";
  monthlyPrice: number;
  deposit: number;
  includesDispenser: boolean;
  /** Litres per active subscription-day (sustainability estimates). */
  litresPerDay: number;
};

export const PLAN_SEEDS: readonly PlanSeed[] = [
  { name: "starter", monthlyPrice: 499, deposit: 2000, includesDispenser: false, litresPerDay: 8 },
  { name: "standard", monthlyPrice: 799, deposit: 3000, includesDispenser: true, litresPerDay: 12 },
  { name: "premium", monthlyPrice: 1199, deposit: 5000, includesDispenser: true, litresPerDay: 18 },
] as const;

export type TechnicianSeed = {
  name: string;
  areaName: string;
  /** Staggered so the workforce grows with the business. */
  joinMonthsAgo: number;
  active: boolean;
  /**
   * Relative ticket load. In high-infra areas 1–2 techs absorb most of the
   * demand - this is what makes the technician workload chart interesting.
   */
  loadWeight: number;
};

export const TECHNICIAN_SEEDS: readonly TechnicianSeed[] = [
  { name: "Ramesh Gowda", areaName: "Whitefield", joinMonthsAgo: 22, active: true, loadWeight: 5 },
  { name: "Suresh Kumar", areaName: "Whitefield", joinMonthsAgo: 15, active: true, loadWeight: 2 },
  { name: "Prakash Reddy", areaName: "Whitefield", joinMonthsAgo: 7, active: false, loadWeight: 1 },
  { name: "Manjunath N", areaName: "Electronic City", joinMonthsAgo: 21, active: true, loadWeight: 4 },
  { name: "Vinay Shetty", areaName: "Electronic City", joinMonthsAgo: 10, active: true, loadWeight: 1 },
  { name: "Imran Pasha", areaName: "Sarjapur Road", joinMonthsAgo: 20, active: true, loadWeight: 4 },
  { name: "Karthik Rao", areaName: "Sarjapur Road", joinMonthsAgo: 9, active: true, loadWeight: 1 },
  { name: "Lokesh B", areaName: "HSR Layout", joinMonthsAgo: 19, active: true, loadWeight: 1 },
  { name: "Naveen Joseph", areaName: "Koramangala", joinMonthsAgo: 17, active: true, loadWeight: 1 },
  { name: "Shivraj Patil", areaName: "Indiranagar", joinMonthsAgo: 14, active: true, loadWeight: 1 },
  { name: "Anand Krishna", areaName: "Jayanagar", joinMonthsAgo: 12, active: true, loadWeight: 1 },
  { name: "Basavaraju H", areaName: "Hebbal", joinMonthsAgo: 6, active: true, loadWeight: 1 },
] as const;
