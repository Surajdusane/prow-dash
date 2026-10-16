import type { Faker } from "@faker-js/faker";

import { addDays, chance, daysBetween, pickWeighted, poisson, randInt, toDateKey } from "@/db/seed/patterns";

export type ComplaintCategory = "water_quality" | "service_delay" | "billing" | "device_malfunction" | "other";
export type ComplaintSeverity = "low" | "medium" | "high";

export type ComplaintSeed = {
  householdId: number;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  date: string;
  resolved: boolean;
  resolutionDate: string | null;
};

export type ComplaintHouseholdContext = {
  id: number;
  joinDate: Date;
  cancelDate: Date | null;
  riskCohort: boolean;
  cohortWindow: { start: string; end: string } | null;
};

export function generateComplaints(
  faker: Faker,
  ctx: { today: Date; households: ComplaintHouseholdContext[] }
): ComplaintSeed[] {
  const complaints: ComplaintSeed[] = [];

  for (const household of ctx.households) {
    const join = new Date(household.joinDate);
    const activeEnd = household.cancelDate ? new Date(household.cancelDate) : ctx.today;
    const dates: Date[] = [];

    if (household.riskCohort && household.cohortWindow) {
      // Injected cluster: 2–4 complaints inside the bad window, skewed toward
      // the end of it so the signal stays hot for the scoring windows.
      const start = new Date(household.cohortWindow.start);
      const windowDays = Math.max(1, daysBetween(start, new Date(household.cohortWindow.end)));
      const count = randInt(faker, 2, 4);
      for (let i = 0; i < count; i += 1) {
        const fraction = Math.sqrt(faker.number.float({ min: 0, max: 1 }));
        dates.push(addDays(start, Math.min(windowDays, Math.round(fraction * windowDays))));
      }
    } else {
      const count = poisson(faker, 1.75);
      for (let i = 0; i < count; i += 1) {
        const date = sampleSeasonalDate(faker, addDays(join, 3), addDays(activeEnd, -2));
        if (date) dates.push(date);
      }
    }

    for (const date of dates) {
      if (date < join || date >= ctx.today) continue;
      const complaint = buildComplaint(faker, household.id, date, household.riskCohort, ctx.today);
      if (complaint) complaints.push(complaint);
    }
  }

  return complaints;
}

/** Complaint volume peaks with the monsoon (water/device issues) and after it (service backlog). */
function complaintMonthWeight(date: Date): number {
  const month = date.getMonth();
  if (month >= 5 && month <= 9) return 1.45; // monsoon
  if (month === 8 || month === 9) return 1.35; // post-monsoon service backlog
  if (month >= 2 && month <= 4) return 1.1;
  return 1;
}

function sampleSeasonalDate(faker: Faker, from: Date, to: Date): Date | null {
  if (to <= from) return null;
  const span = daysBetween(from, to);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = addDays(from, randInt(faker, 0, span));
    const weight = complaintMonthWeight(candidate);
    if (faker.number.float({ min: 0, max: 1.45 }) < weight) return candidate;
  }
  return addDays(from, randInt(faker, 0, span));
}

function pickCategory(faker: Faker, date: Date): ComplaintCategory {
  const month = date.getMonth();
  const monsoon = month >= 5 && month <= 9;
  const postMonsoon = month === 8 || month === 9;
  return pickWeighted(faker, [
    ["water_quality", monsoon ? 42 : 30],
    ["device_malfunction", monsoon ? 28 : 20],
    ["service_delay", postMonsoon ? 30 : 16],
    ["billing", 13],
    ["other", 6],
  ]);
}

function buildComplaint(
  faker: Faker,
  householdId: number,
  date: Date,
  riskCohort: boolean,
  today: Date
): ComplaintSeed | null {
  const ageDays = daysBetween(date, today);
  if (ageDays < 0) return null;

  const category = pickCategory(faker, date);
  const severity = riskCohort
    ? pickWeighted(faker, [
        ["low", 0.25],
        ["medium", 0.45],
        ["high", 0.3],
      ] as const)
    : pickWeighted(faker, [
        ["low", 0.5],
        ["medium", 0.35],
        ["high", 0.15],
      ] as const);

  let resolved: boolean;
  let resolutionDate: Date | null = null;
  if (ageDays > 10) {
    resolved = true;
    resolutionDate = addDays(date, randInt(faker, 1, 9));
  } else {
    resolved = chance(faker, 0.45);
    if (resolved) resolutionDate = addDays(date, randInt(faker, 0, 3));
  }
  if (resolutionDate && resolutionDate > today) resolutionDate = today;
  if (resolutionDate && resolutionDate < date) resolutionDate = date;

  return {
    householdId,
    category,
    severity,
    date: toDateKey(date),
    resolved,
    resolutionDate: resolved && resolutionDate ? toDateKey(resolutionDate) : null,
  };
}
