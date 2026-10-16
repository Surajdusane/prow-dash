import type { Database } from "@/db";
import { and, count, eq, gte, inArray, sql } from "drizzle-orm";

import { complaints, households, payments, serviceTickets } from "@/db/schema";

/**
 * Shared household risk scoring (0–100) used by the seed, the /customers
 * "recompute" mutation and the optional cron job.
 *
 * Signals: recent complaints (weight × severity, unresolved bonus), late/failed
 * payments over 6 months, SLA misses on the household's tickets and tenure
 * (newer households are slightly riskier). Clamped to 0–100.
 */

export type HouseholdRiskInput = {
  complaints90d: number;
  highSeverityComplaints90d: number;
  unresolvedComplaints90d: number;
  latePayments6mo: number;
  failedPayments6mo: number;
  slaMissedTickets12mo: number;
  tenureDays: number;
};

export type RiskBand = "low" | "medium" | "high";

export const RISK_BAND_THRESHOLDS = { medium: 34, high: 67 } as const;

export function riskBand(score: number): RiskBand {
  if (score >= RISK_BAND_THRESHOLDS.high) return "high";
  if (score >= RISK_BAND_THRESHOLDS.medium) return "medium";
  return "low";
}

export function computeHouseholdRisk(input: HouseholdRiskInput): number {
  const complaintScore = Math.min(
    45,
    input.complaints90d * 9 + input.highSeverityComplaints90d * 5 + input.unresolvedComplaints90d * 5
  );
  const paymentScore = Math.min(45, input.latePayments6mo * 7 + input.failedPayments6mo * 11);
  const slaScore = Math.min(16, input.slaMissedTickets12mo * 4);
  const tenureScore = input.tenureDays < 90 ? 8 : input.tenureDays < 180 ? 5 : input.tenureDays < 365 ? 2 : 0;

  return Math.max(0, Math.min(100, Math.round(complaintScore + paymentScore + slaScore + tenureScore)));
}

/* Small date helpers kept local so app queries never depend on the seed folder. */

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function startOfMonth(date: Date): Date {
  const copy = new Date(date);
  copy.setDate(1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const UPDATE_CHUNK_SIZE = 400;

/**
 * Recompute `households.riskScore` for every household (or a single one when
 * `householdId` is provided). Returns the number of households scored.
 */
export async function recomputeAllRiskScores(db: Database, options: { householdId?: number } = {}): Promise<number> {
  const now = new Date();
  const ninetyDaysAgo = toDateKey(addDays(now, -90));
  const sixMonthsAgo = toDateKey(startOfMonth(addMonths(now, -5)));
  const twelveMonthsAgo = toDateKey(addDays(now, -365));

  const householdRows = await db
    .select({ id: households.id, joinDate: households.joinDate })
    .from(households)
    .where(options.householdId ? eq(households.id, options.householdId) : undefined);

  if (householdRows.length === 0) return 0;

  const [complaintRows, paymentRows, slaRows] = await Promise.all([
    db
      .select({
        householdId: complaints.householdId,
        total: count(),
        high: sql<number>`count(*) filter (where ${complaints.severity} = 'high')`.mapWith(Number),
        unresolved: sql<number>`count(*) filter (where ${complaints.resolved} = false)`.mapWith(Number),
      })
      .from(complaints)
      .where(
        and(
          gte(complaints.date, ninetyDaysAgo),
          options.householdId ? eq(complaints.householdId, options.householdId) : undefined
        )
      )
      .groupBy(complaints.householdId),
    db
      .select({
        householdId: payments.householdId,
        late: sql<number>`count(*) filter (where ${payments.status} = 'late')`.mapWith(Number),
        failed: sql<number>`count(*) filter (where ${payments.status} = 'failed')`.mapWith(Number),
      })
      .from(payments)
      .where(
        and(
          gte(payments.billingMonth, sixMonthsAgo),
          inArray(payments.status, ["late", "failed"]),
          options.householdId ? eq(payments.householdId, options.householdId) : undefined
        )
      )
      .groupBy(payments.householdId),
    db
      .select({
        householdId: serviceTickets.householdId,
        missed: count(),
      })
      .from(serviceTickets)
      .where(
        and(
          eq(serviceTickets.slaMet, false),
          gte(serviceTickets.raisedDate, twelveMonthsAgo),
          options.householdId ? eq(serviceTickets.householdId, options.householdId) : undefined
        )
      )
      .groupBy(serviceTickets.householdId),
  ]);

  const complaintsByHousehold = new Map(complaintRows.map((row) => [row.householdId, row]));
  const paymentsByHousehold = new Map(paymentRows.map((row) => [row.householdId, row]));
  const slaByHousehold = new Map(slaRows.map((row) => [row.householdId, row]));

  const updates = householdRows.map((household) => {
    const complaintStats = complaintsByHousehold.get(household.id);
    const paymentStats = paymentsByHousehold.get(household.id);
    const tenureDays = Math.max(0, Math.round((now.getTime() - new Date(household.joinDate).getTime()) / 86_400_000));

    return {
      id: household.id,
      score: computeHouseholdRisk({
        complaints90d: complaintStats?.total ?? 0,
        highSeverityComplaints90d: complaintStats?.high ?? 0,
        unresolvedComplaints90d: complaintStats?.unresolved ?? 0,
        latePayments6mo: paymentStats?.late ?? 0,
        failedPayments6mo: paymentStats?.failed ?? 0,
        slaMissedTickets12mo: slaByHousehold.get(household.id)?.missed ?? 0,
        tenureDays,
      }),
    };
  });

  for (let i = 0; i < updates.length; i += UPDATE_CHUNK_SIZE) {
    const chunk = updates.slice(i, i + UPDATE_CHUNK_SIZE);
    await db.execute(sql`
      UPDATE households AS h
      SET risk_score = v.score
      FROM (VALUES ${sql.join(
        chunk.map((update) => sql`(${update.id}::int, ${update.score}::int)`),
        sql`, `
      )}) AS v(id, score)
      WHERE h.id = v.id AND h.risk_score IS DISTINCT FROM v.score
    `);
  }

  return updates.length;
}
