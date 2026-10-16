import type { Faker } from "@faker-js/faker";

import type { HouseholdSeed, PlanName } from "@/db/seed/generators/households";
import { addDays, chance, randInt } from "@/db/seed/patterns";

export type DispenserType = "own_device" | "standard" | "premium";

export type DispenserSeed = {
  householdId: number;
  areaName: string;
  type: DispenserType;
  planName: PlanName;
  installDate: Date;
  /** Last day of service: cancel date, or today while active. */
  activeEnd: Date;
  /** Readings stop earlier when a device has gone offline. */
  readingEnd: Date;
  isOnline: boolean;
};

const ONLINE_SHARE = 0.96;

function dispenserTypeForPlan(planName: PlanName): DispenserType {
  if (planName === "starter") return "own_device";
  return planName;
}

export function generateDispensers(
  faker: Faker,
  households: (HouseholdSeed & { id: number })[],
  ctx: { today: Date }
): DispenserSeed[] {
  return households.map((household) => {
    const join = new Date(household.joinDate);
    // Install a few days after joining, but never in the future and never before the join date.
    const latestInstall = join > addDays(ctx.today, -5) ? join : addDays(ctx.today, -5);
    let installDate = addDays(join, randInt(faker, 2, 7));
    if (installDate > latestInstall) installDate = latestInstall;

    let activeEnd = household.cancelDate ? new Date(household.cancelDate) : ctx.today;
    if (activeEnd <= installDate) activeEnd = addDays(installDate, 1);

    const isOnline = chance(faker, ONLINE_SHARE);
    let readingEnd = activeEnd;
    if (!isOnline) {
      const offlineSince = addDays(ctx.today, -randInt(faker, 9, 75));
      readingEnd = offlineSince < installDate ? installDate : offlineSince;
      if (readingEnd > activeEnd) readingEnd = activeEnd;
    }
    const earliestReadingEnd = addDays(installDate, 14);
    if (readingEnd < earliestReadingEnd) readingEnd = earliestReadingEnd;
    if (readingEnd > activeEnd) readingEnd = activeEnd;

    return {
      householdId: household.id,
      areaName: household.areaName,
      type: dispenserTypeForPlan(household.planName),
      planName: household.planName,
      installDate,
      activeEnd,
      readingEnd,
      isOnline,
    };
  });
}
