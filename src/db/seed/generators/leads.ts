import type { Faker } from "@faker-js/faker";

import { addDays, chance, daysBetween, pickWeighted, randInt, randomTimeOnDay, toDateKey } from "@/db/seed/patterns";

export type LeadRole = "rwa_secretary" | "resident" | "builder" | "other";

export type LeadSeed = {
  name: string;
  societyName: string | null;
  role: LeadRole;
  source: string;
  visitDate: string | null;
  converted: boolean;
  flatsConverted: number;
  createdAt: Date;
};

const LEAD_SOURCES = [
  ["instagram", 32],
  ["referral", 22],
  ["google", 20],
  ["walk-in", 13],
  ["broker", 13],
] as const;

/**
 * Independent sales funnel over the 24 months: leads arrive faster over time,
 * ~40% get a site visit, ~20% of visiters convert (RWA-level deals convert
 * several flats at once).
 */
export function generateLeads(
  faker: Faker,
  ctx: { today: Date; windowStart: Date; societyNames: string[]; count: number }
): LeadSeed[] {
  const span = Math.max(1, daysBetween(ctx.windowStart, ctx.today));
  const leads: LeadSeed[] = [];

  for (let i = 0; i < ctx.count; i += 1) {
    // Skewed toward recent months - the sales pipeline is growing.
    const skew = Math.pow(faker.number.float({ min: 0, max: 1 }), 0.65);
    const createdAt = randomTimeOnDay(faker, addDays(ctx.windowStart, Math.round(skew * span)), 9, 19);

    const role = pickWeighted(faker, [
      ["resident", 45],
      ["rwa_secretary", 20],
      ["builder", 20],
      ["other", 15],
    ] as const);
    const source = pickWeighted(faker, LEAD_SOURCES);

    const visited = chance(faker, 0.4);
    let visitDate: string | null = null;
    if (visited) {
      const candidate = addDays(createdAt, randInt(faker, 0, 12));
      visitDate = toDateKey(candidate > ctx.today ? ctx.today : candidate);
    }

    const converted = visited && chance(faker, 0.22);
    const societyName =
      chance(faker, 0.8) && ctx.societyNames.length > 0 ? faker.helpers.arrayElement(ctx.societyNames) : null;

    leads.push({
      name: faker.person.fullName(),
      societyName,
      role,
      source,
      visitDate,
      converted,
      flatsConverted: converted ? randInt(faker, 1, 5) : 0,
      createdAt,
    });
  }

  return leads;
}
