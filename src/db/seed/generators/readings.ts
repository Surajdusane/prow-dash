import type { Faker } from "@faker-js/faker";

import type { PlanName } from "@/db/seed/generators/households";
import {
  addDays,
  addHours,
  chance,
  clamp,
  daysBetween,
  deriveHardness,
  derivePurity,
  FILTER_CHANGE_MAX_DAYS,
  FILTER_CHANGE_MIN_DAYS,
  infraDriftFactor,
  projectTds,
  randFloat,
  randInt,
  randomTimeOnDay,
  round1,
  seasonalityMultiplier,
  TDS_REPAIR_THRESHOLD,
} from "@/db/seed/patterns";

export type RepairEvent = {
  raisedDate: Date;
  resolutionDate: Date;
  tdsAtCross: number;
  purityAtCross: number;
};

export type FilterCycle = {
  start: Date;
  scheduledEnd: Date;
  end: Date;
  baseline: number;
  ceiling: number;
  /** Drift speed multiplier (infra age × season × usage). */
  speed: number;
  repair: RepairEvent | null;
  /** True when the service life ended mid-cycle - no change event was emitted. */
  truncated: boolean;
};

export type DispenserLife = {
  cycles: FilterCycle[];
  /** Dates the filter was actually replaced (scheduled changes + repairs). */
  filterChangeDates: Date[];
  repairs: RepairEvent[];
};

export type ReadingSeed = {
  recordedAt: Date;
  tdsPpm: number;
  ph: string;
  hardnessMgl: number;
  purityPct: string;
};

const PLAN_INTENSITY: Record<PlanName, number> = { starter: 0.95, standard: 1, premium: 1.08 };

/** Areas at this infrastructure age or above drift hard (Whitefield / E-City / Sarjapur Road). */
const HIGH_INFRA_THRESHOLD = 9.5;

/** Repairs resolve in 3–68h (skewed short) - SLA target is 48h. */
function repairResolutionHours(faker: Faker): number {
  const u = faker.number.float({ min: 0, max: 1 });
  return Math.round(3 + u * u * 65);
}

/** Filter-change visits resolve in 6–96h - SLA target is 72h. */
function filterResolutionHours(faker: Faker): number {
  const u = faker.number.float({ min: 0, max: 1 });
  return Math.round(6 + u * u * 90);
}

/**
 * Simulate one dispenser's service life as a chain of filter cycles.
 *
 * Between replacements TDS climbs toward a per-cycle ceiling while purity and
 * hardness degrade; each replacement resets the curve sharply. In high-infra
 * areas (and during monsoon/summer) the drift is faster, so the hard threshold
 * is crossed *before* the scheduled change - those early crossings become
 * genuinely predictive repair tickets.
 */
export function simulateDispenserLife(
  faker: Faker,
  ctx: {
    installDate: Date;
    activeEnd: Date;
    infrastructureAgeYears: number;
    planName: PlanName;
  }
): DispenserLife {
  const cycles: FilterCycle[] = [];
  const filterChangeDates: Date[] = [];
  const repairs: RepairEvent[] = [];

  const planIntensity = PLAN_INTENSITY[ctx.planName];
  const highInfra = ctx.infrastructureAgeYears >= HIGH_INFRA_THRESHOLD;

  let cycleStart = ctx.installDate;
  let guard = 0;

  while (daysBetween(cycleStart, ctx.activeEnd) >= 15 && guard < 80) {
    guard += 1;

    const scheduledDays = randInt(faker, FILTER_CHANGE_MIN_DAYS, FILTER_CHANGE_MAX_DAYS);
    const scheduledEnd = addDays(cycleStart, scheduledDays);
    const baseline = randInt(faker, 105, 140);
    const ceiling = highInfra ? randInt(faker, 480, 560) : randInt(faker, 385, 470);
    const midDate = addDays(cycleStart, Math.round(scheduledDays / 2));
    const speed = Number(
      (
        infraDriftFactor(ctx.infrastructureAgeYears) *
        seasonalityMultiplier(midDate) *
        planIntensity *
        randFloat(faker, 0.94, 1.06, 2)
      ).toFixed(2)
    );

    // Analytically find the day TDS crosses the hard threshold (if it does).
    let repair: RepairEvent | null = null;
    if (ceiling > TDS_REPAIR_THRESHOLD + 5) {
      const crossRatio = Math.pow((TDS_REPAIR_THRESHOLD - baseline) / (ceiling - baseline), 1 / 1.12);
      const crossDay = Math.round((crossRatio * scheduledDays) / speed);
      if (crossDay >= 5 && crossDay <= scheduledDays - 4) {
        const raisedDate = addDays(cycleStart, crossDay);
        const resolutionDate = addHours(raisedDate, repairResolutionHours(faker));
        const progress = (crossDay * speed) / scheduledDays;
        const tdsAtCross = Math.round(projectTds(progress, baseline, ceiling));
        repair = { raisedDate, resolutionDate, tdsAtCross, purityAtCross: derivePurity(tdsAtCross) };
      }
    }

    // Occasional hardware fault in any area (keeps repairs from being exclusive
    // to high-infra zones, though those still dominate).
    if (!repair && chance(faker, 0.04)) {
      const faultDay = randInt(faker, 5, scheduledDays - 4);
      const raisedDate = addDays(cycleStart, faultDay);
      const resolutionDate = addHours(raisedDate, repairResolutionHours(faker));
      const progress = (faultDay * speed) / scheduledDays;
      const tdsAtCross = Math.round(projectTds(progress, baseline, ceiling));
      repair = { raisedDate, resolutionDate, tdsAtCross, purityAtCross: derivePurity(tdsAtCross) };
    }

    const candidateEnd = repair ? repair.resolutionDate : addHours(scheduledEnd, filterResolutionHours(faker));
    const truncated = candidateEnd > ctx.activeEnd;
    const end = truncated ? ctx.activeEnd : candidateEnd;

    cycles.push({ start: cycleStart, scheduledEnd, end, baseline, ceiling, speed, repair, truncated });
    if (!truncated) {
      filterChangeDates.push(end);
      if (repair) repairs.push(repair);
    }

    cycleStart = end;
  }

  // Service-life tail: after the last completed change (or after a recent
  // install) fewer than 15 days may remain. Telemetry should keep flowing to
  // activeEnd - the next change is still pending, so this cycle is truncated
  // and emits no filter-change events.
  const tailDays = daysBetween(cycleStart, ctx.activeEnd);
  if (tailDays >= 1) {
    const scheduledDays = randInt(faker, FILTER_CHANGE_MIN_DAYS, FILTER_CHANGE_MAX_DAYS);
    const baseline = randInt(faker, 105, 140);
    const ceiling = highInfra ? randInt(faker, 480, 560) : randInt(faker, 385, 470);
    const midDate = addDays(cycleStart, Math.round(scheduledDays / 2));

    cycles.push({
      start: cycleStart,
      scheduledEnd: addDays(cycleStart, scheduledDays),
      end: ctx.activeEnd,
      baseline,
      ceiling,
      speed: Number(
        (
          infraDriftFactor(ctx.infrastructureAgeYears) *
          seasonalityMultiplier(midDate) *
          planIntensity *
          randFloat(faker, 0.94, 1.06, 2)
        ).toFixed(2)
      ),
      repair: null,
      truncated: true,
    });
  }

  return { cycles, filterChangeDates, repairs };
}

/**
 * Materialise the telemetry for a simulated life. Readings land every 2–3 days
 * (~2.5×/week) with noise, monsoon hardness bumps and a sharp reset after each
 * replacement.
 */
export function buildReadings(faker: Faker, ctx: { readingEnd: Date; now: Date }, life: DispenserLife): ReadingSeed[] {
  const readings: ReadingSeed[] = [];

  for (const cycle of life.cycles) {
    const scheduledDays = daysBetween(cycle.start, cycle.scheduledEnd);
    const baseHardness = randInt(faker, 170, 215);
    const ceilingHardness = Math.round(baseHardness * randFloat(faker, 1.65, 1.95, 2));
    const cycleDays = daysBetween(cycle.start, cycle.end);

    let day = randInt(faker, 0, 2);
    while (day <= cycleDays) {
      const at = randomTimeOnDay(faker, addDays(cycle.start, day), 6, 22);
      if (at <= ctx.readingEnd && at <= ctx.now) {
        const progress = (day * cycle.speed) / scheduledDays;
        const tds = Math.max(
          95,
          Math.round(projectTds(progress, cycle.baseline, cycle.ceiling) + randFloat(faker, -5, 5, 0))
        );
        const purity = round1(clamp(derivePurity(tds) + randFloat(faker, -0.4, 0.4, 1), 82, 98.5));
        const hardness = Math.max(
          90,
          deriveHardness(baseHardness, ceilingHardness, progress, at) + randInt(faker, -7, 7)
        );
        readings.push({
          recordedAt: at,
          tdsPpm: tds,
          ph: randFloat(faker, 6.8, 7.4, 1).toFixed(1),
          hardnessMgl: hardness,
          purityPct: purity.toFixed(1),
        });
      }
      day += randInt(faker, 2, 3);
    }
  }

  return readings;
}
