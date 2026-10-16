import type { PaymentStatus } from "@/db/queries/payments";
import type { PlanName } from "@/db/queries/plans";
import {
  PAYMENT_STATUS_COLOR_PAIRS,
  PAYMENT_STATUS_SWATCHES,
  PLAN_COLOR_PAIRS,
  PLAN_SWATCHES,
} from "@/lib/chart-colors";
import type { GetOverdueInput } from "@/trpc/schema";

/* ────────────────────────────────────────────────────────────────────────────
   Labels
   ──────────────────────────────────────────────────────────────────────────── */

export const PLAN_LABELS: Record<PlanName, string> = {
  starter: "Starter",
  standard: "Standard",
  premium: "Premium",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  late: "Late",
  failed: "Failed",
  pending: "Pending",
};

/** Fixed order so stacked charts and legends always read the same way. */
export const PAYMENT_STATUS_ORDER: PaymentStatus[] = ["paid", "late", "failed", "pending"];

export { PAYMENT_STATUS_COLOR_PAIRS, PAYMENT_STATUS_SWATCHES, PLAN_COLOR_PAIRS, PLAN_SWATCHES };

/** Badge tone for an overdue payment's status (pending is never overdue — just safe). */
export function paymentStatusVariant(status: PaymentStatus): "success" | "warning" | "error" | "outline" {
  if (status === "paid") return "success";
  if (status === "late") return "warning";
  if (status === "failed") return "error";
  return "outline";
}

/* ────────────────────────────────────────────────────────────────────────────
   Overdue table state ⇄ tRPC input
   ──────────────────────────────────────────────────────────────────────────── */

export const OVERDUE_PAGE_SIZE = 25;

export type OverdueTableState = { page: number };

export const DEFAULT_OVERDUE_TABLE_STATE: OverdueTableState = { page: 1 };

/** Unset filters are omitted entirely so the prefetch key and first render key match. */
export function toOverdueTableInput(state: OverdueTableState): GetOverdueInput {
  return { page: state.page, limit: OVERDUE_PAGE_SIZE };
}

/**
 * Days since the billing month's due date. The seed anchors every month's bill
 * to its 1st (paid dates are `month + 0–6d`), so "late by" counts from there —
 * never negative, and zero-safe for the current month.
 */
export function daysLate(billingMonth: string, now: Date = new Date()): number {
  const [year, month] = billingMonth.split("-").map(Number);
  const due = new Date(year, (month ?? 1) - 1, 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today.getTime() - due.getTime()) / 86_400_000));
}

/* ────────────────────────────────────────────────────────────────────────────
   Cohort retention matrix
   ──────────────────────────────────────────────────────────────────────────── */

/** Columns shown before the "show more" toggle; the query caps retention at 12. */
export const COHORT_VISIBLE_COLUMNS = 7;
export const COHORT_MAX_COLUMNS = 12;

/**
 * Whole months between a cohort's join month and `now`. Cells past this age
 * have no data yet — the query zero-fills them with today's snapshot, so the
 * UI must blank them instead of drawing a fake future.
 */
export function cohortAgeMonths(cohortMonth: string, now: Date = new Date()): number {
  const [year, month] = cohortMonth.split("-").map(Number);
  return (now.getFullYear() - year) * 12 + (now.getMonth() - ((month ?? 1) - 1));
}

/** Heat-shade alpha (0–1) for a retention percentage: light → dark. */
export function retentionShade(pct: number): number {
  return Math.max(0, Math.min(1, pct / 100));
}
