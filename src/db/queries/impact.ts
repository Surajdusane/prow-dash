import type { Database } from "@/db";
import { eq } from "drizzle-orm";

import { plans, subscriptions } from "@/db/schema";

import { JAR_SIZE_LITRES, PLAN_LITRES_PER_DAY, type PlanName } from "./plans";
import { addMonths, daysBetween, lastMonths, roundTo, startOfDay } from "./utils";

export type ImpactTotals = {
  litresServed: number;
  jarsAvoided: number;
  householdsServed: number;
  monthsLive: number;
};

export type ImpactMonthlyPoint = {
  /** `YYYY-MM` */
  month: string;
  litres: number;
  jarsAvoided: number;
  cumulativeLitres: number;
  cumulativeJarsAvoided: number;
};

export type ImpactByPlanRow = {
  plan: PlanName;
  litres: number;
  jarsAvoided: number;
};

type SubscriptionSpan = {
  householdId: number;
  planName: PlanName;
  startDate: string;
  endDate: string | null;
};

async function fetchSubscriptionSpans(db: Database): Promise<SubscriptionSpan[]> {
  return db
    .select({
      householdId: subscriptions.householdId,
      planName: plans.name,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId));
}

function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

/** Active days in `[spanStart, spanEnd)` — endDate (cancel date) is not an active day. */
function activeDays(spanStart: Date, spanEnd: Date): number {
  return Math.max(0, daysBetween(spanStart, spanEnd));
}

export async function getImpactTotals(db: Database): Promise<ImpactTotals> {
  const spans = await fetchSubscriptionSpans(db);
  const today = startOfDay(new Date());

  let litres = 0;
  let earliestStart: Date | null = null;
  const households = new Set<number>();

  for (const span of spans) {
    const start = parseDateKey(span.startDate);
    const end = span.endDate ? parseDateKey(span.endDate) : today;
    litres += activeDays(start, end) * PLAN_LITRES_PER_DAY[span.planName];
    households.add(span.householdId);
    if (earliestStart === null || start < earliestStart) earliestStart = start;
  }

  const monthsLive = earliestStart === null ? 0 : Math.max(1, Math.round(daysBetween(earliestStart, today) / 30.44));

  return {
    litresServed: Math.round(litres),
    jarsAvoided: Math.round(litres / JAR_SIZE_LITRES),
    householdsServed: households.size,
    monthsLive,
  };
}

/** Monthly litres + jars (and cumulative), estimated from subscription-days × plan litres/day. */
export async function getImpactMonthlyTrend(db: Database, months = 24): Promise<ImpactMonthlyPoint[]> {
  const spans = await fetchSubscriptionSpans(db);
  const today = startOfDay(new Date());

  let cumulativeLitres = 0;
  let cumulativeJars = 0;

  return lastMonths(months).map((window) => {
    const monthEnd = addMonths(window.start, 1); // exclusive
    let litres = 0;

    for (const span of spans) {
      const spanStart = parseDateKey(span.startDate);
      const spanEnd = span.endDate ? parseDateKey(span.endDate) : today;
      const overlapStart = spanStart > window.start ? spanStart : window.start;
      const overlapEnd = spanEnd < monthEnd ? spanEnd : monthEnd;
      const days = activeDays(overlapStart, overlapEnd);
      litres += days * PLAN_LITRES_PER_DAY[span.planName];
    }

    const jars = litres / JAR_SIZE_LITRES;
    cumulativeLitres += litres;
    cumulativeJars += jars;

    return {
      month: window.key,
      litres: Math.round(litres),
      jarsAvoided: roundTo(jars),
      cumulativeLitres: Math.round(cumulativeLitres),
      cumulativeJarsAvoided: roundTo(cumulativeJars),
    };
  });
}

export async function getImpactByPlan(db: Database): Promise<ImpactByPlanRow[]> {
  const spans = await fetchSubscriptionSpans(db);
  const today = startOfDay(new Date());
  const byPlan = new Map<PlanName, number>();

  for (const span of spans) {
    const start = parseDateKey(span.startDate);
    const end = span.endDate ? parseDateKey(span.endDate) : today;
    const litres = activeDays(start, end) * PLAN_LITRES_PER_DAY[span.planName];
    byPlan.set(span.planName, (byPlan.get(span.planName) ?? 0) + litres);
  }

  const order: PlanName[] = ["starter", "standard", "premium"];
  return order
    .filter((plan) => byPlan.has(plan))
    .map((plan) => {
      const litres = byPlan.get(plan) ?? 0;
      return { plan, litres: Math.round(litres), jarsAvoided: Math.round(litres / JAR_SIZE_LITRES) };
    });
}
