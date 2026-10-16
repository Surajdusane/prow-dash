import type { Faker } from "@faker-js/faker";

import { addDays, addMonths, allocateExactly, startOfMonth, toDateKey } from "@/db/seed/patterns";
import { AREA_SEEDS } from "@/db/seed/reference";

export type SocietySeed = {
  areaName: string;
  name: string;
  totalFlats: number;
  onboardedDate: string;
  latitude: number;
  longitude: number;
};

/**
 * Onboarding waves across months 1–14 of the window — a growth curve that
 * starts slow, peaks mid-year one, then tapers (the sales team gets pickier).
 */
const WAVE_WEIGHTS = [6, 6, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 1];

/** Societies per area — high-infra areas get a little more footprint. */
const AREA_ALLOCATION = [6, 8, 6, 5, 6, 7, 7, 5]; // matches AREA_SEEDS order

const NAME_PREFIXES = [
  "Prestige",
  "Brigade",
  "Sobha",
  "Puravankara",
  "Godrej",
  "Shriram",
  "Salarpuria",
  "Gopalan",
  "Mantri",
  "Mahaveer",
  "Adarsh",
  "Sumadhura",
  "Vaswani",
  "Esteem",
  "Greenland",
] as const;

const NAME_SUFFIXES = [
  "Enclave",
  "Residency",
  "Heights",
  "Greens",
  "Meadows",
  "Grandeur",
  "Springs",
  "Orchards",
  "Harmony",
  "Lakeview",
] as const;

export function generateSocieties(faker: Faker, ctx: { today: Date; count: number; windowStart: Date }): SocietySeed[] {
  const monthSlots = allocateExactly(ctx.count, WAVE_WEIGHTS).flatMap((n, monthIndex) =>
    Array.from({ length: n }, () => monthIndex)
  );
  const areaSlots = allocateExactly(ctx.count, AREA_ALLOCATION).flatMap((n, areaIndex) =>
    Array.from({ length: n }, () => AREA_SEEDS[areaIndex])
  );

  const shuffledMonths = faker.helpers.shuffle(monthSlots);
  const shuffledAreas = faker.helpers.shuffle(areaSlots);
  const usedNames = new Set<string>();

  return shuffledMonths.map((monthIndex, index) => {
    const area = shuffledAreas[index];
    const monthStart = startOfMonth(addMonths(ctx.windowStart, monthIndex));
    const onboardedDate = toDateKey(addDays(monthStart, faker.number.int({ min: 0, max: 27 })));

    let name = `${faker.helpers.arrayElement(NAME_PREFIXES)} ${faker.helpers.arrayElement(NAME_SUFFIXES)}`;
    let attempt = 0;
    while (usedNames.has(name) && attempt < 20) {
      name = `${faker.helpers.arrayElement(NAME_PREFIXES)} ${faker.helpers.arrayElement(NAME_SUFFIXES)}`;
      attempt += 1;
    }
    if (usedNames.has(name)) name = `${name} ${index + 1}`;
    usedNames.add(name);

    return {
      areaName: area.name,
      name,
      totalFlats: faker.number.int({ min: 80, max: 400 }),
      onboardedDate,
      latitude: Number((area.latitude + faker.number.float({ min: -0.018, max: 0.018, fractionDigits: 4 })).toFixed(4)),
      longitude: Number(
        (area.longitude + faker.number.float({ min: -0.018, max: 0.018, fractionDigits: 4 })).toFixed(4)
      ),
    };
  });
}
