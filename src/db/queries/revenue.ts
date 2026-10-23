import type { Database } from "@/db";
import { count, eq, sql } from "drizzle-orm";

import { households, payments, plans, subscriptions } from "@/db/schema";

import type { PlanName } from "./plans";
import { addMonths, endOfMonth, lastMonths, startOfMonth, toDateKey, toPercent } from "./utils";

export type RevenueKpis = {
  mrr: number;
  arpu: number;
  activeSubs: number;
  failedPctThisMonth: number;
  /** Collected ÷ billed over the last three billing months, 0–100. */
  collectionsRate90d: number;
};

export type MrrTrendPoint = {
  /** `YYYY-MM` */
  month: string;
  mrr: number;
};

export type PlanMixTrendPoint = {
  /** `YYYY-MM` */
  month: string;
  starter: number;
  standard: number;
  premium: number;
};

export type CohortRetentionRow = {
  /** `YYYY-MM` */
  cohortMonth: string;
  size: number;
  /** % of the cohort still active at each month-end since joining (k = 0, 1, …). */
  retention: number[];
};

type SubscriptionSpan = {
  planName: PlanName;
  monthlyPrice: number;
  startDate: string;
  endDate: string | null;
};

async function fetchSubscriptionSpans(db: Database): Promise<SubscriptionSpan[]> {
  return db
    .select({
      planName: plans.name,
      monthlyPrice: plans.monthlyPrice,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId));
}

export async function getRevenueKpis(db: Database): Promise<RevenueKpis> {
  const now = new Date();
  const monthStartKey = toDateKey(startOfMonth(now));
  const ninetyWindowStart = toDateKey(startOfMonth(addMonths(now, -2)));

  const [subscriptionRow, paymentRow] = await Promise.all([
    db
      .select({
        activeSubs: count(),
        mrr: sql<number>`coalesce(sum(${plans.monthlyPrice}), 0)`.mapWith(Number),
      })
      .from(subscriptions)
      .innerJoin(plans, eq(plans.id, subscriptions.planId))
      .where(eq(subscriptions.status, "active")),
    db
      .select({
        thisMonthTotal: sql<number>`count(*) filter (where ${payments.billingMonth} = ${monthStartKey})`.mapWith(
          Number
        ),
        thisMonthFailed:
          sql<number>`count(*) filter (where ${payments.billingMonth} = ${monthStartKey} and ${payments.status} = 'failed')`.mapWith(
            Number
          ),
        billed90:
          sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.billingMonth} >= ${ninetyWindowStart}), 0)`.mapWith(
            Number
          ),
        collected90:
          sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.billingMonth} >= ${ninetyWindowStart} and ${payments.paidDate} is not null), 0)`.mapWith(
            Number
          ),
      })
      .from(payments),
  ]);

  const activeSubs = subscriptionRow[0]?.activeSubs ?? 0;
  const mrr = subscriptionRow[0]?.mrr ?? 0;
  const thisMonthTotal = paymentRow[0]?.thisMonthTotal ?? 0;
  const thisMonthFailed = paymentRow[0]?.thisMonthFailed ?? 0;
  const billed90 = paymentRow[0]?.billed90 ?? 0;
  const collected90 = paymentRow[0]?.collected90 ?? 0;

  return {
    mrr,
    arpu: activeSubs > 0 ? Math.round(mrr / activeSubs) : 0,
    activeSubs,
    failedPctThisMonth: toPercent(thisMonthFailed, thisMonthTotal),
    collectionsRate90d: toPercent(collected90, billed90),
  };
}

/**
 * MRR at each month end, reconstructed from subscription start/end dates -
 * no snapshot table needed. The current month is capped at today.
 */
export async function getMrrTrend(db: Database, months = 18): Promise<MrrTrendPoint[]> {
  const spans = await fetchSubscriptionSpans(db);
  const todayKey = toDateKey(new Date());

  return lastMonths(months).map(({ key, end }) => {
    const endKey = toDateKey(end) > todayKey ? todayKey : toDateKey(end);
    const mrr = spans.reduce((total, span) => {
      if (span.startDate > endKey) return total;
      if (span.endDate !== null && span.endDate <= endKey) return total;
      return total + span.monthlyPrice;
    }, 0);

    return { month: key, mrr };
  });
}

/** Active subscription counts per plan at each month end (stacked chart). */
export async function getPlanMixTrend(db: Database, months = 18): Promise<PlanMixTrendPoint[]> {
  const spans = await fetchSubscriptionSpans(db);
  const todayKey = toDateKey(new Date());

  return lastMonths(months).map(({ key, end }) => {
    const endKey = toDateKey(end) > todayKey ? todayKey : toDateKey(end);
    const point: PlanMixTrendPoint = { month: key, starter: 0, standard: 0, premium: 0 };

    for (const span of spans) {
      if (span.startDate > endKey) continue;
      if (span.endDate !== null && span.endDate <= endKey) continue;
      point[span.planName] += 1;
    }

    return point;
  });
}

/**
 * Cohort retention by join month: `active at t ⇔ joinDate ≤ t AND
 * (cancelDate IS NULL OR cancelDate > t)`. The whole book is ~1.2k rows, so
 * fetching it once and shaping server-side is simpler and more honest than
 * fighting correlated SQL.
 */
export async function getCohortRetention(db: Database, cohorts = 12, months = 12): Promise<CohortRetentionRow[]> {
  const rows = await db.select({ joinDate: households.joinDate, cancelDate: households.cancelDate }).from(households);

  const todayKey = toDateKey(new Date());

  return lastMonths(cohorts).map((cohort) => {
    const cohortStartKey = toDateKey(cohort.start);
    const cohortEndKey = toDateKey(cohort.end);
    const members = rows.filter((row) => row.joinDate >= cohortStartKey && row.joinDate <= cohortEndKey);

    const retention: number[] = [];
    for (let index = 0; index < months; index += 1) {
      const monthEnd = endOfMonth(addMonths(cohort.start, index));
      const monthEndKey = toDateKey(monthEnd) > todayKey ? todayKey : toDateKey(monthEnd);
      const active = members.filter(
        (member) => member.joinDate <= monthEndKey && (member.cancelDate === null || member.cancelDate > monthEndKey)
      ).length;
      retention.push(toPercent(active, members.length));
    }

    return { cohortMonth: cohort.key, size: members.length, retention };
  });
}
