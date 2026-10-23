import type { FunnelStage } from "@/db/queries/leads";
import type { LeadRole } from "@/db/queries/leads-mutations";
import { categoryColorPair, categorySwatch } from "@/lib/chart-colors";
import type { GetLeadListInput } from "@/trpc/schema";

/* ────────────────────────────────────────────────────────────────────────────
   Labels
   ──────────────────────────────────────────────────────────────────────────── */

export const LEAD_ROLE_LABELS: Record<LeadRole, string> = {
  rwa_secretary: "RWA secretary",
  resident: "Resident",
  builder: "Builder",
  other: "Other",
};

export const LEAD_ROLES = Object.keys(LEAD_ROLE_LABELS) as LeadRole[];

/** The five known acquisition channels - mirrors the seed's weighted sources. */
export const LEAD_SOURCES = ["instagram", "referral", "google", "walk-in", "broker"] as const;

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  referral: "Referral",
  google: "Google",
  "walk-in": "Walk-in",
  broker: "Broker",
};

/** Falls back to the raw value for sources added outside the known list. */
export function leadSourceLabel(source: string): string {
  return LEAD_SOURCE_LABELS[source] ?? source;
}

/* ────────────────────────────────────────────────────────────────────────────
   Funnel
   ──────────────────────────────────────────────────────────────────────────── */

export const FUNNEL_STAGE_LABELS: Record<FunnelStage["stage"], string> = {
  leads: "Leads",
  visits: "Visits",
  converted: "Converted",
};

export const FUNNEL_STAGE_ORDER: FunnelStage["stage"][] = ["leads", "visits", "converted"];

/** One hue per funnel stage - leads sky, visits violet, converted emerald. */
export const FUNNEL_STAGE_COLOR_PAIRS = {
  leads: categoryColorPair(0),
  visits: categoryColorPair(1),
  converted: categoryColorPair(2),
} as const;

export const FUNNEL_STAGE_SWATCHES = {
  leads: categorySwatch(0),
  visits: categorySwatch(1),
  converted: categorySwatch(2),
} as const;

/* ────────────────────────────────────────────────────────────────────────────
   Leads table state ⇄ tRPC input
   ──────────────────────────────────────────────────────────────────────────── */

export const LEADS_TABLE_PAGE_SIZE = 25;

export type LeadsTableState = {
  page: number;
  source?: string;
  converted?: boolean;
};

export const DEFAULT_LEADS_TABLE_STATE: LeadsTableState = { page: 1 };

/**
 * Maps UI state to the tRPC input. Unset filters are omitted entirely so the
 * server prefetch key and the first client render key are byte-identical.
 */
export function toLeadsTableInput(state: LeadsTableState): GetLeadListInput {
  return {
    page: state.page,
    limit: LEADS_TABLE_PAGE_SIZE,
    ...(state.source ? { source: state.source } : {}),
    ...(state.converted !== undefined ? { converted: state.converted } : {}),
  };
}
