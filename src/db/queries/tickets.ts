import type { Database } from "@/db";
import { and, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";

import { areas, dispensers, households, serviceTickets, societies, technicians } from "@/db/schema";

import { addDays, roundTo, toDateKey } from "./utils";

export type TicketType = "filter_change" | "repair" | "installation" | "inspection";
export type TicketStatus = "open" | "in_progress" | "resolved";

/** Documented SLA targets (master plan §6): hours from raise to resolve. */
export const SLA_HOURS: Record<TicketType, number> = {
  repair: 48,
  filter_change: 72,
  inspection: 96,
  installation: 120,
};

/** Flat row shaped for the kanban board and ticket tables. */
export type BoardTicket = {
  id: number;
  type: TicketType;
  status: TicketStatus;
  raisedDate: string;
  resolvedDate: string | null;
  slaMet: boolean | null;
  technicianId: number | null;
  technicianName: string | null;
  householdId: number;
  residentName: string;
  flatNumber: string;
  societyId: number;
  societyName: string;
  areaId: number;
  areaName: string;
};

export type GetBoardParams = {
  areaId?: number;
  type?: TicketType;
  search?: string;
};

export type CreateTicketParams = {
  householdId: number;
  type: TicketType;
};

export type UpdateTicketStatusParams = {
  id: number;
  status: TicketStatus;
};

export type AssignTicketParams = {
  id: number;
  technicianId: number | null;
};

export type SlaStats = {
  open: number;
  overdue7d: number;
  avgResolutionDays: number;
  slaMetPct90d: number;
};

export type TechnicianWorkloadRow = {
  technicianId: number;
  technicianName: string;
  areaName: string;
  openTickets: number;
  resolved30d: number;
  avgResolutionDays: number;
};

/** How many resolved tickets the board ships per request (newest first). */
const RESOLVED_BOARD_CAP = 60;

const boardSelection = {
  id: serviceTickets.id,
  type: serviceTickets.type,
  status: serviceTickets.status,
  raisedDate: serviceTickets.raisedDate,
  resolvedDate: serviceTickets.resolvedDate,
  slaMet: serviceTickets.slaMet,
  technicianId: technicians.id,
  technicianName: technicians.name,
  householdId: households.id,
  residentName: households.residentName,
  flatNumber: households.flatNumber,
  societyId: societies.id,
  societyName: societies.name,
  areaId: areas.id,
  areaName: areas.name,
} as const;

function boardQuery(db: Database) {
  return db
    .select(boardSelection)
    .from(serviceTickets)
    .innerJoin(households, eq(serviceTickets.householdId, households.id))
    .innerJoin(societies, eq(households.societyId, societies.id))
    .innerJoin(areas, eq(societies.areaId, areas.id))
    .leftJoin(technicians, eq(serviceTickets.technicianId, technicians.id));
}

function boardFilters(params: GetBoardParams) {
  return [
    params.areaId ? eq(areas.id, params.areaId) : undefined,
    params.type ? eq(serviceTickets.type, params.type) : undefined,
    params.search
      ? or(
          ilike(households.residentName, `%${params.search}%`),
          ilike(households.flatNumber, `%${params.search}%`),
          ilike(societies.name, `%${params.search}%`)
        )
      : undefined,
  ];
}

export async function getTicketById(db: Database, id: number): Promise<BoardTicket | null> {
  const [ticket] = await boardQuery(db).where(eq(serviceTickets.id, id));
  return ticket ?? null;
}

/**
 * Board payload: every open/in-progress ticket plus the tickets resolved in the
 * last 30 days (capped). The client derives the four kanban columns from
 * status + technician presence.
 */
export async function getBoard(db: Database, params: GetBoardParams = {}): Promise<BoardTicket[]> {
  const filters = boardFilters(params);
  const resolvedSince = toDateKey(addDays(new Date(), -30));

  const [active, resolved] = await Promise.all([
    boardQuery(db)
      .where(and(inArray(serviceTickets.status, ["open", "in_progress"]), ...filters))
      .orderBy(desc(serviceTickets.raisedDate), desc(serviceTickets.id)),
    boardQuery(db)
      .where(and(eq(serviceTickets.status, "resolved"), gte(serviceTickets.resolvedDate, resolvedSince), ...filters))
      .orderBy(desc(serviceTickets.resolvedDate), desc(serviceTickets.id))
      .limit(RESOLVED_BOARD_CAP),
  ]);

  return [...active, ...resolved];
}

/** Creates an open ticket against the household's dispenser. Returns null when the household has none. */
export async function createTicket(db: Database, params: CreateTicketParams): Promise<BoardTicket | null> {
  const [dispenser] = await db
    .select({ id: dispensers.id })
    .from(dispensers)
    .where(eq(dispensers.householdId, params.householdId))
    .orderBy(desc(dispensers.installDate))
    .limit(1);

  if (!dispenser) return null;

  const [ticket] = await db
    .insert(serviceTickets)
    .values({
      householdId: params.householdId,
      dispenserId: dispenser.id,
      type: params.type,
      status: "open",
      raisedDate: toDateKey(new Date()),
    })
    .returning({ id: serviceTickets.id });

  return getTicketById(db, ticket.id);
}

/**
 * Moves a ticket between statuses. Resolving stamps `resolvedDate` today and
 * computes `slaMet` against the Phase-1 SLA targets; reopening clears both.
 */
export async function updateTicketStatus(db: Database, params: UpdateTicketStatusParams): Promise<BoardTicket | null> {
  const [existing] = await db
    .select({ id: serviceTickets.id, type: serviceTickets.type, raisedDate: serviceTickets.raisedDate })
    .from(serviceTickets)
    .where(eq(serviceTickets.id, params.id));

  if (!existing) return null;

  if (params.status === "resolved") {
    const resolvedAt = new Date();
    const raisedAt = new Date(`${existing.raisedDate}T00:00:00`);
    const hoursElapsed = (resolvedAt.getTime() - raisedAt.getTime()) / 3_600_000;

    await db
      .update(serviceTickets)
      .set({
        status: "resolved",
        resolvedDate: toDateKey(resolvedAt),
        slaMet: hoursElapsed <= SLA_HOURS[existing.type],
      })
      .where(eq(serviceTickets.id, params.id));
  } else {
    await db
      .update(serviceTickets)
      .set({ status: params.status, resolvedDate: null, slaMet: null })
      .where(eq(serviceTickets.id, params.id));
  }

  return getTicketById(db, params.id);
}

/** Assigns (or clears) the technician. `technicianId: null` sends the ticket back to "New". */
export async function assignTicket(db: Database, params: AssignTicketParams): Promise<BoardTicket | null> {
  const [updated] = await db
    .update(serviceTickets)
    .set({ technicianId: params.technicianId })
    .where(eq(serviceTickets.id, params.id))
    .returning({ id: serviceTickets.id });

  if (!updated) return null;
  return getTicketById(db, updated.id);
}

export async function removeTicket(db: Database, id: number): Promise<{ id: number } | null> {
  const [deleted] = await db
    .delete(serviceTickets)
    .where(eq(serviceTickets.id, id))
    .returning({ id: serviceTickets.id });

  return deleted ?? null;
}

export async function getSlaStats(db: Database): Promise<SlaStats> {
  const overdueKey = toDateKey(addDays(new Date(), -7));
  const ninetyAgo = toDateKey(addDays(new Date(), -90));

  const [statusRow, resolutionRow] = await Promise.all([
    db
      .select({
        open: sql<number>`count(*) filter (where ${serviceTickets.status} <> 'resolved')`.mapWith(Number),
        overdue7d:
          sql<number>`count(*) filter (where ${serviceTickets.status} <> 'resolved' and ${serviceTickets.raisedDate} <= ${overdueKey})`.mapWith(
            Number
          ),
      })
      .from(serviceTickets),
    db
      .select({
        avgResolutionDays:
          sql<number>`coalesce(avg(${serviceTickets.resolvedDate} - ${serviceTickets.raisedDate}) filter (where ${serviceTickets.resolvedDate} is not null), 0)`.mapWith(
            Number
          ),
        slaMetPct90d:
          sql<number>`coalesce(round(100.0 * count(*) filter (where ${serviceTickets.slaMet} = true) / nullif(count(*) filter (where ${serviceTickets.slaMet} is not null), 0), 1), 0)`.mapWith(
            Number
          ),
      })
      .from(serviceTickets)
      .where(gte(serviceTickets.raisedDate, ninetyAgo)),
  ]);

  return {
    open: statusRow[0]?.open ?? 0,
    overdue7d: statusRow[0]?.overdue7d ?? 0,
    avgResolutionDays: roundTo(resolutionRow[0]?.avgResolutionDays ?? 0),
    slaMetPct90d: roundTo(resolutionRow[0]?.slaMetPct90d ?? 0),
  };
}

export async function getTechnicianWorkload(db: Database): Promise<TechnicianWorkloadRow[]> {
  const thirtyDaysAgo = toDateKey(addDays(new Date(), -30));

  const rows = await db
    .select({
      technicianId: technicians.id,
      technicianName: technicians.name,
      areaName: areas.name,
      openTickets: sql<number>`count(*) filter (where ${serviceTickets.status} <> 'resolved')`.mapWith(Number),
      resolved30d:
        sql<number>`count(*) filter (where ${serviceTickets.resolvedDate} is not null and ${serviceTickets.resolvedDate} >= ${thirtyDaysAgo})`.mapWith(
          Number
        ),
      avgResolutionDays:
        sql<number>`coalesce(avg(${serviceTickets.resolvedDate} - ${serviceTickets.raisedDate}) filter (where ${serviceTickets.resolvedDate} is not null), 0)`.mapWith(
          Number
        ),
    })
    .from(technicians)
    .innerJoin(areas, eq(technicians.areaId, areas.id))
    .leftJoin(serviceTickets, eq(serviceTickets.technicianId, technicians.id))
    .groupBy(technicians.id, technicians.name, areas.name)
    .orderBy(desc(sql`count(*) filter (where ${serviceTickets.status} <> 'resolved')`), technicians.name);

  return rows.map((row) => ({
    ...row,
    avgResolutionDays: roundTo(row.avgResolutionDays),
  }));
}
