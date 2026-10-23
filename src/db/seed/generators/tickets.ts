import type { Faker } from "@faker-js/faker";

import type { DispenserLife } from "@/db/seed/generators/readings";
import { addDays, addHours, chance, daysBetween, pickWeighted, randInt, toDateKey } from "@/db/seed/patterns";

export type TicketType = "filter_change" | "repair" | "installation" | "inspection";
export type TicketStatus = "open" | "in_progress" | "resolved";

export type TicketSeed = {
  householdId: number;
  dispenserId: number;
  technicianId: number | null;
  type: TicketType;
  status: TicketStatus;
  raisedDate: string;
  resolvedDate: string | null;
  slaMet: boolean | null;
};

export type TechnicianRef = {
  id: number;
  areaName: string;
  joinDate: Date;
  active: boolean;
  loadWeight: number;
};

export const SLA_HOURS: Record<TicketType, number> = {
  repair: 48,
  filter_change: 72,
  inspection: 96,
  installation: 120,
};

function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 3_600_000;
}

/** Prefer same-area technicians who had already joined when the ticket was raised. */
function pickTechnician(
  faker: Faker,
  ctx: { technicians: TechnicianRef[]; areaName: string },
  raised: Date
): number | null {
  const joinedBy = addDays(raised, 2);
  const sameArea = ctx.technicians.filter(
    (tech) => tech.areaName === ctx.areaName && tech.joinDate <= joinedBy && tech.active
  );
  if (sameArea.length > 0) {
    return pickWeighted(
      faker,
      sameArea.map((tech) => [tech.id, tech.loadWeight] as const)
    );
  }
  const anyArea = ctx.technicians.filter((tech) => tech.joinDate <= addDays(raised, 30) && tech.active);
  if (anyArea.length > 0) {
    return faker.helpers.arrayElement(anyArea).id;
  }
  return null;
}

function makeTicket(
  faker: Faker,
  ctx: {
    today: Date;
    now: Date;
    technicians: TechnicianRef[];
    areaName: string;
    householdId: number;
    dispenserId: number;
  },
  type: TicketType,
  raised: Date,
  resolved: Date
): TicketSeed {
  const ageDays = daysBetween(raised, ctx.today);

  let status: TicketStatus;
  let resolvedDate: Date | null = null;
  let slaMet: boolean | null = null;

  if (resolved > ctx.now) {
    // Still in flight - the visit is due but hasn't happened yet.
    status = chance(faker, 0.5) ? "open" : "in_progress";
  } else if (ageDays > 14) {
    if (chance(faker, 0.06)) {
      // A small share of old tickets get neglected - these feed the "overdue >7d" KPI.
      status = chance(faker, 0.4) ? "open" : "in_progress";
    } else {
      status = "resolved";
      resolvedDate = resolved;
      slaMet = hoursBetween(raised, resolved) <= SLA_HOURS[type];
    }
  } else {
    const roll = faker.number.float({ min: 0, max: 1 });
    if (roll < 0.3) {
      status = "open";
    } else if (roll < 0.6) {
      status = "in_progress";
    } else {
      status = "resolved";
      resolvedDate = resolved;
      slaMet = hoursBetween(raised, resolved) <= SLA_HOURS[type];
    }
  }

  const technicianId = status === "open" && chance(faker, 0.55) ? null : pickTechnician(faker, ctx, raised);

  return {
    householdId: ctx.householdId,
    dispenserId: ctx.dispenserId,
    technicianId,
    type,
    status,
    raisedDate: toDateKey(raised),
    resolvedDate: resolvedDate ? toDateKey(resolvedDate) : null,
    slaMet,
  };
}

/**
 * Convert a dispenser's simulated life into tickets:
 * - `filter_change` at each *scheduled* replacement (the calendar plan),
 * - `repair` when the hard threshold is crossed early (predictive service),
 * - `installation` for ~70% of households,
 * - occasional `inspection` visits.
 */
export function buildDispenserTickets(
  faker: Faker,
  ctx: {
    today: Date;
    now: Date;
    technicians: TechnicianRef[];
    areaName: string;
    householdId: number;
    dispenserId: number;
    installDate: Date;
  },
  life: DispenserLife
): TicketSeed[] {
  const tickets: TicketSeed[] = [];

  if (chance(faker, 0.7)) {
    const u = faker.number.float({ min: 0, max: 1 });
    tickets.push(
      makeTicket(faker, ctx, "installation", ctx.installDate, addHours(ctx.installDate, Math.round(8 + u * u * 140)))
    );
  }

  for (const cycle of life.cycles) {
    if (cycle.truncated) continue;

    if (cycle.repair) {
      tickets.push(makeTicket(faker, ctx, "repair", cycle.repair.raisedDate, cycle.repair.resolutionDate));
    } else {
      tickets.push(makeTicket(faker, ctx, "filter_change", cycle.scheduledEnd, cycle.end));
    }

    if (chance(faker, 0.06)) {
      const cycleDays = Math.max(4, daysBetween(cycle.start, cycle.end));
      const raised = addDays(cycle.start, randInt(faker, 2, cycleDays - 1));
      const u = faker.number.float({ min: 0, max: 1 });
      tickets.push(makeTicket(faker, ctx, "inspection", raised, addHours(raised, Math.round(6 + u * u * 130))));
    }
  }

  return tickets;
}
