import type { Faker } from "@faker-js/faker";

import {
  addDays,
  addMonths,
  endOfMonth,
  monthKey,
  pickWeighted,
  randInt,
  startOfMonth,
  toDateKey,
} from "@/db/seed/patterns";

export type PaymentStatus = "paid" | "late" | "failed" | "pending";

export type PaymentSeed = {
  householdId: number;
  subscriptionId: number;
  billingMonth: string;
  amount: number;
  status: PaymentStatus;
  paidDate: string | null;
};

export type PaymentSubscriptionContext = {
  subscriptionId: number;
  householdId: number;
  amount: number;
  startDate: Date;
  endDate: Date | null;
  cohortWindow: { start: string; end: string } | null;
};

function isMonthInCohortWindow(month: Date, window: { start: string; end: string }): boolean {
  const from = addMonths(startOfMonth(new Date(window.start)), -1); // drift starts slightly before the cluster
  const to = endOfMonth(new Date(window.end));
  return month >= from && month <= to;
}

function pickStatus(faker: Faker, month: Date, currentMonth: Date, inCohortWindow: boolean): PaymentStatus {
  if (inCohortWindow) {
    return pickWeighted(faker, [
      ["paid", 0.2],
      ["late", 0.5],
      ["failed", 0.3],
    ] as const);
  }
  if (month.getTime() === currentMonth.getTime()) {
    return pickWeighted(faker, [
      ["paid", 0.58],
      ["late", 0.05],
      ["failed", 0.04],
      ["pending", 0.33],
    ] as const);
  }
  return pickWeighted(faker, [
    ["paid", 0.88],
    ["late", 0.08],
    ["failed", 0.04],
  ] as const);
}

/**
 * One payment row per active subscription-month. Risk-cohort households carry
 * (and slightly precede) their bad window with late/failed payments.
 */
export function generatePayments(
  faker: Faker,
  ctx: { today: Date; subscriptions: PaymentSubscriptionContext[] }
): PaymentSeed[] {
  const payments: PaymentSeed[] = [];
  const currentMonth = startOfMonth(ctx.today);

  for (const subscription of ctx.subscriptions) {
    const firstMonth = startOfMonth(subscription.startDate);
    const lastMonth = startOfMonth(subscription.endDate ?? ctx.today);
    if (firstMonth > lastMonth) continue;

    for (let month = firstMonth; month <= lastMonth; month = addMonths(month, 1)) {
      const inCohortWindow = subscription.cohortWindow
        ? isMonthInCohortWindow(month, subscription.cohortWindow)
        : false;
      const status = pickStatus(faker, month, currentMonth, inCohortWindow);

      let paidDate: Date | null = null;
      if (status === "paid") {
        const maxOffset = Math.max(0, Math.min(6, Math.round((ctx.today.getTime() - month.getTime()) / 86_400_000)));
        paidDate = addDays(month, randInt(faker, 0, maxOffset));
      } else if (status === "late") {
        paidDate = addDays(month, randInt(faker, 8, 28));
        if (paidDate > ctx.today) paidDate = ctx.today;
      }

      payments.push({
        householdId: subscription.householdId,
        subscriptionId: subscription.subscriptionId,
        billingMonth: monthKey(month),
        amount: subscription.amount,
        status,
        paidDate: paidDate ? toDateKey(paidDate) : null,
      });
    }
  }

  return payments;
}
