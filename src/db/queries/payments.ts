import type { Database } from "@/db";
import { count, desc, eq, inArray, sql } from "drizzle-orm";

import { households, payments, societies } from "@/db/schema";

import { lastMonths, toDateKey } from "./utils";

export type PaymentStatus = "paid" | "late" | "failed" | "pending";

export type BillingTrendPoint = {
  /** `YYYY-MM` */
  month: string;
  billed: number;
  collected: number;
};

export type PaymentStatusPoint = {
  /** `YYYY-MM` */
  month: string;
  paid: number;
  late: number;
  failed: number;
  pending: number;
};

export type OverduePaymentRow = {
  paymentId: number;
  householdId: number;
  residentName: string;
  flatNumber: string;
  societyName: string;
  billingMonth: string;
  amount: number;
  status: PaymentStatus;
  paidDate: string | null;
};

export type OverduePaymentsResult = {
  rows: OverduePaymentRow[];
  total: number;
};

export type GetOverdueParams = {
  page: number;
  limit: number;
};

const overdueSelection = {
  paymentId: payments.id,
  householdId: households.id,
  residentName: households.residentName,
  flatNumber: households.flatNumber,
  societyName: societies.name,
  billingMonth: payments.billingMonth,
  amount: payments.amount,
  status: payments.status,
  paidDate: payments.paidDate,
} as const;

/**
 * Billed vs collected per billing month (last `months` months, zero-filled).
 * "Collected" counts any payment that carries a `paidDate` — late payers that
 * eventually settled are money in the bank.
 */
export async function getBillingTrend(db: Database, months = 18): Promise<BillingTrendPoint[]> {
  const monthExpr = sql<string>`to_char(date_trunc('month', ${payments.billingMonth}), 'YYYY-MM')`;

  const rows = await db
    .select({
      month: monthExpr,
      billed: sql<number>`coalesce(sum(${payments.amount}), 0)`.mapWith(Number),
      collected:
        sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.paidDate} is not null), 0)`.mapWith(
          Number
        ),
    })
    .from(payments)
    .groupBy(monthExpr);

  const byMonth = new Map(rows.map((row) => [row.month, row]));
  return lastMonths(months).map(({ key }) => ({
    month: key,
    billed: byMonth.get(key)?.billed ?? 0,
    collected: byMonth.get(key)?.collected ?? 0,
  }));
}

/** Payment status counts per billing month (last `months` months, zero-filled). */
export async function getPaymentStatusByMonth(db: Database, months = 12): Promise<PaymentStatusPoint[]> {
  const monthExpr = sql<string>`to_char(date_trunc('month', ${payments.billingMonth}), 'YYYY-MM')`;

  const rows = await db
    .select({
      month: monthExpr,
      status: payments.status,
      total: count(),
    })
    .from(payments)
    .groupBy(monthExpr, payments.status);

  const windows = lastMonths(months);
  const byMonth = new Map<string, PaymentStatusPoint>();
  for (const { key } of windows) {
    byMonth.set(key, { month: key, paid: 0, late: 0, failed: 0, pending: 0 });
  }
  for (const row of rows) {
    const point = byMonth.get(row.month);
    if (!point) continue; // outside the window — nothing to chart
    point[row.status] = row.total;
  }

  return windows.map(({ key }) => byMonth.get(key)!);
}

export async function getOverduePayments(db: Database, params: GetOverdueParams): Promise<OverduePaymentsResult> {
  const filters = inArray(payments.status, ["late", "failed"]);
  const offset = (params.page - 1) * params.limit;

  const [rows, [totals]] = await Promise.all([
    db
      .select(overdueSelection)
      .from(payments)
      .innerJoin(households, eq(payments.householdId, households.id))
      .innerJoin(societies, eq(households.societyId, societies.id))
      .where(filters)
      .orderBy(desc(payments.billingMonth), desc(payments.amount), desc(payments.id))
      .limit(params.limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(payments)
      .innerJoin(households, eq(payments.householdId, households.id))
      .where(filters),
  ]);

  return { rows, total: totals?.total ?? 0 };
}

/** Marks an overdue/failed payment as paid today. Returns null when missing. */
export async function markPaymentPaid(db: Database, paymentId: number): Promise<OverduePaymentRow | null> {
  const [updated] = await db
    .update(payments)
    .set({ status: "paid", paidDate: toDateKey(new Date()) })
    .where(eq(payments.id, paymentId))
    .returning({ id: payments.id });

  if (!updated) return null;

  const [row] = await db
    .select(overdueSelection)
    .from(payments)
    .innerJoin(households, eq(payments.householdId, households.id))
    .innerJoin(societies, eq(households.societyId, societies.id))
    .where(eq(payments.id, updated.id));

  return row ?? null;
}
