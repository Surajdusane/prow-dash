import type { Faker } from "@faker-js/faker";

import type { SocietySeed } from "@/db/seed/generators/societies";
import { addDays, addMonths, chance, clamp, daysBetween, pickWeighted, randInt, toDateKey } from "@/db/seed/patterns";
import type { PlanSeed } from "@/db/seed/reference";

export type PlanName = PlanSeed["name"];

export type CohortWindow = { start: string; end: string };

export type HouseholdSeed = {
  societyId: number;
  areaName: string;
  flatNumber: string;
  residentName: string;
  phone: string;
  joinDate: string;
  status: "active" | "cancelled";
  cancelDate: string | null;
  planName: PlanName;
  planId: number;
  /** ~12% of households - cluster of complaints + payment failures, sometimes churn. */
  riskCohort: boolean;
  cohortWindow: CohortWindow | null;
};

export type SubscriptionSeed = {
  householdId: number;
  planId: number;
  startDate: string;
  endDate: string | null;
  status: "active" | "cancelled";
  billingCycle: string;
};

const RISK_COHORT_SHARE = 0.13;
const COHORT_CANCEL_SHARE = 0.6;
const BASE_CHURN_SHARE = 0.08;
/** Share of households that joined within the last ~90 days (drives "new this month" KPIs). */
const RECENT_JOINER_SHARE = 0.07;

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/**
 * Plan mix at signup shifts over the 24 months: early adopters were cheap
 * "starter" users; later cohorts increasingly pick standard/premium.
 */
function pickPlanName(faker: Faker, joinDate: Date, windowStart: Date): PlanName {
  const monthsIn = clamp(daysBetween(windowStart, joinDate) / 30.4, 0, 23);
  const t = monthsIn / 23;
  const starterShare = lerp(0.45, 0.12, t);
  const premiumShare = lerp(0.08, 0.35, t);
  const standardShare = 1 - starterShare - premiumShare;
  return pickWeighted(faker, [
    ["starter", starterShare],
    ["standard", standardShare],
    ["premium", premiumShare],
  ]);
}

function uniqueFlatNumber(faker: Faker, used: Set<string>): string {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const floor = randInt(faker, 1, 18);
    const unit = `${randInt(faker, 1, 12)}`.padStart(2, "0");
    const flat = `${floor}${unit}`;
    if (!used.has(flat)) {
      used.add(flat);
      return flat;
    }
  }
  const fallback = `G${used.size + 1}`;
  used.add(fallback);
  return fallback;
}

export function generateHouseholds(
  faker: Faker,
  ctx: {
    today: Date;
    windowStart: Date;
    societies: { id: number; seed: SocietySeed }[];
    plans: { name: PlanName; id: number }[];
  }
): HouseholdSeed[] {
  const planByName = new Map(ctx.plans.map((plan) => [plan.name, plan]));
  const households: HouseholdSeed[] = [];

  for (const { id: societyId, seed: society } of ctx.societies) {
    const householdCount = randInt(faker, 12, 34);
    const usedFlats = new Set<string>();
    const onboarded = new Date(society.onboardedDate);
    const latestJoin = addDays(ctx.today, -5);

    for (let i = 0; i < householdCount; i += 1) {
      // 78% join shortly after the society onboards, the rest trickle in later.
      let join =
        faker.number.float({ min: 0, max: 1 }) < 0.78
          ? addDays(onboarded, randInt(faker, 3, 45))
          : addDays(addMonths(onboarded, randInt(faker, 3, 9)), randInt(faker, 0, 20));
      if (join > latestJoin) join = addDays(latestJoin, -randInt(faker, 0, 25));
      if (join < addDays(onboarded, 1)) join = addDays(onboarded, 1);

      // A slice of households join recently - organic growth inside existing societies.
      if (chance(faker, RECENT_JOINER_SHARE)) {
        const recentJoin = addDays(ctx.today, -randInt(faker, 3, 90));
        if (recentJoin > join) join = recentJoin;
      }

      const riskCohort = chance(faker, RISK_COHORT_SHARE);
      const planName = pickPlanName(faker, join, ctx.windowStart);
      const household: HouseholdSeed = {
        societyId,
        areaName: society.areaName,
        flatNumber: uniqueFlatNumber(faker, usedFlats),
        residentName: faker.person.fullName(),
        phone: `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`,
        joinDate: toDateKey(join),
        status: "active",
        cancelDate: null,
        planName,
        planId: planByName.get(planName)!.id,
        riskCohort,
        cohortWindow: null,
      };

      if (riskCohort) {
        // Bad windows land in the recent past (skewed): the ops story is
        // *current* risk, so payments/complaints should still fall inside the
        // 6mo/90d scoring windows for households that are about to cancel.
        const u = faker.number.float({ min: 0, max: 1 });
        const offsetDays = Math.round(Math.pow(u, 2) * 207); // skew toward recent
        let windowEnd = addDays(ctx.today, -33 - offsetDays);
        const minStart = addDays(join, 45);
        let windowStart = addDays(windowEnd, -randInt(faker, 60, 120));
        if (windowStart < minStart) {
          windowStart = minStart;
          if (windowEnd < addDays(windowStart, 20)) windowEnd = addDays(windowStart, 20);
          const hardCap = addDays(ctx.today, -12);
          if (windowEnd > hardCap) windowEnd = hardCap;
        }
        household.cohortWindow = { start: toDateKey(windowStart), end: toDateKey(windowEnd) };

        // Some risk-cohort households churn 1–3 months after the bad window.
        if (chance(faker, COHORT_CANCEL_SHARE)) {
          const maxLag = Math.min(90, daysBetween(windowEnd, addDays(ctx.today, -3)));
          if (maxLag >= 30) {
            const cancel = addDays(windowEnd, randInt(faker, 30, maxLag));
            if (cancel >= addDays(join, 90)) household.cancelDate = toDateKey(cancel);
          }
        }
      } else if (chance(faker, BASE_CHURN_SHARE)) {
        const minCancel = addDays(join, 120);
        const maxCancel = addDays(ctx.today, -3);
        if (minCancel < maxCancel) {
          const skewed = Math.sqrt(faker.number.float({ min: 0, max: 1 })); // bias toward later months
          household.cancelDate = toDateKey(addDays(minCancel, Math.round(skewed * daysBetween(minCancel, maxCancel))));
        }
      }

      household.status = household.cancelDate ? "cancelled" : "active";
      households.push(household);
    }
  }

  return households;
}

export function householdsToSubscriptions(households: (HouseholdSeed & { id: number })[]): SubscriptionSeed[] {
  return households.map((household) => ({
    householdId: household.id,
    planId: household.planId,
    startDate: household.joinDate,
    endDate: household.cancelDate,
    status: household.status,
    billingCycle: "monthly",
  }));
}
