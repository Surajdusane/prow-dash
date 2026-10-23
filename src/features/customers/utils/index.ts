import type { ComplaintCategory, ComplaintSeverity } from "@/db/queries/complaints";
import type { HouseholdStatus, RiskSort } from "@/db/queries/customers";
import type { PlanName } from "@/db/queries/plans";
import { RISK_BAND_THRESHOLDS, type RiskBand } from "@/db/queries/risk";
import type { GetRiskTableInput } from "@/trpc/schema";

/* ────────────────────────────────────────────────────────────────────────────
   Labels
   ──────────────────────────────────────────────────────────────────────────── */

export const RISK_BAND_LABELS: Record<RiskBand, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const HOUSEHOLD_STATUS_LABELS: Record<HouseholdStatus, string> = {
  active: "Active",
  cancelled: "Cancelled",
};

export const PLAN_LABELS: Record<PlanName, string> = {
  starter: "Starter",
  standard: "Standard",
  premium: "Premium",
};

export const COMPLAINT_CATEGORIES: ComplaintCategory[] = [
  "water_quality",
  "service_delay",
  "billing",
  "device_malfunction",
  "other",
];

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  water_quality: "Water quality",
  service_delay: "Service delay",
  billing: "Billing",
  device_malfunction: "Device malfunction",
  other: "Other",
};

export const COMPLAINT_SEVERITIES: ComplaintSeverity[] = ["low", "medium", "high"];

export const COMPLAINT_SEVERITY_LABELS: Record<ComplaintSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

/** Mirrors the service-ops labels - ticket vocabulary is shared across routes. */
export const TICKET_TYPE_LABELS: Record<"filter_change" | "repair" | "installation" | "inspection", string> = {
  filter_change: "Filter change",
  repair: "Repair",
  installation: "Installation",
  inspection: "Inspection",
};

export const TICKET_STATUS_LABELS: Record<"open" | "in_progress" | "resolved", string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const PAYMENT_STATUS_LABELS: Record<"paid" | "late" | "failed" | "pending", string> = {
  paid: "Paid",
  late: "Late",
  failed: "Failed",
  pending: "Pending",
};

export const DISPENSER_TYPE_LABELS: Record<"own_device" | "standard" | "premium", string> = {
  own_device: "Own device",
  standard: "Standard",
  premium: "Premium",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<"active" | "cancelled" | "paused", string> = {
  active: "Active",
  cancelled: "Cancelled",
  paused: "Paused",
};

/* ────────────────────────────────────────────────────────────────────────────
   Risk helpers
   ──────────────────────────────────────────────────────────────────────────── */

/** Band for a 0–100 score - mirrors the shared server thresholds. */
export function riskBandOf(score: number): RiskBand {
  if (score >= RISK_BAND_THRESHOLDS.high) return "high";
  if (score >= RISK_BAND_THRESHOLDS.medium) return "medium";
  return "low";
}

/** Tailwind background classes for a band's chart legend swatch. */
export const RISK_BAND_SWATCHES: Record<RiskBand, string> = {
  low: "bg-[#059669] dark:bg-[#34d399]",
  medium: "bg-[#d97706] dark:bg-[#fbbf24]",
  high: "bg-[#e11d48] dark:bg-[#fb7185]",
};

/** SVG stroke classes for the drawer's risk ring, by band. */
export const RISK_BAND_STROKES: Record<RiskBand, string> = {
  low: "stroke-emerald-600 dark:stroke-emerald-400",
  medium: "stroke-amber-600 dark:stroke-amber-400",
  high: "stroke-rose-600 dark:stroke-rose-400",
};

/** Text classes for risk numbers, by band. */
export const RISK_BAND_TEXT: Record<RiskBand, string> = {
  low: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-rose-600 dark:text-rose-400",
};

/** Badge variant for a band. */
export function riskBandBadgeVariant(band: RiskBand): "success" | "warning" | "error" {
  if (band === "high") return "error";
  if (band === "medium") return "warning";
  return "success";
}

/* ────────────────────────────────────────────────────────────────────────────
   Service / billing badge tones
   ──────────────────────────────────────────────────────────────────────────── */

export function ticketStatusVariant(status: "open" | "in_progress" | "resolved"): "warning" | "info" | "success" {
  if (status === "resolved") return "success";
  if (status === "in_progress") return "info";
  return "warning";
}

export function paymentStatusVariant(
  status: "paid" | "late" | "failed" | "pending"
): "success" | "warning" | "error" | "outline" {
  if (status === "paid") return "success";
  if (status === "late") return "warning";
  if (status === "failed") return "error";
  return "outline";
}

export function complaintSeverityVariant(severity: "low" | "medium" | "high"): "outline" | "warning" | "error" {
  if (severity === "high") return "error";
  if (severity === "medium") return "warning";
  return "outline";
}

/* ────────────────────────────────────────────────────────────────────────────
   Risk table state ⇄ tRPC input
   ──────────────────────────────────────────────────────────────────────────── */

export const RISK_TABLE_PAGE_SIZE = 25;

export type RiskTableState = {
  page: number;
  sort: RiskSort;
  dir: "asc" | "desc";
  riskBand?: RiskBand;
  areaId?: number;
  status?: HouseholdStatus;
};

export const DEFAULT_RISK_TABLE_STATE: RiskTableState = {
  page: 1,
  sort: "risk",
  dir: "desc",
};

/**
 * Maps UI state to the tRPC input. Unset filters are omitted entirely so the
 * server prefetch key and the first client render key are byte-identical.
 */
export function toRiskTableInput(state: RiskTableState): GetRiskTableInput {
  return {
    page: state.page,
    limit: RISK_TABLE_PAGE_SIZE,
    sort: state.sort,
    dir: state.dir,
    ...(state.riskBand ? { riskBand: state.riskBand } : {}),
    ...(state.areaId ? { areaId: state.areaId } : {}),
    ...(state.status ? { status: state.status } : {}),
  };
}
