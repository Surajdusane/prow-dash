import type { Database } from "@/db";
import { and, asc, count, countDistinct, desc, eq, gte, ilike, sql } from "drizzle-orm";

import { areas, dispensers, households, plans, readings, serviceTickets, societies, subscriptions } from "@/db/schema";

import type { PlanName } from "./plans";
import { addDays, lastMonths, roundTo, startOfDay, toDateKey, toPercent } from "./utils";

export type SocietiesKpis = {
  societies: number;
  /** Active households ÷ flats covered, 0–100. */
  avgPenetration: number;
  flatsCovered: number;
  areas: number;
};

export type SocietySort = "penetration" | "subscribed" | "totalFlats" | "openTickets" | "avgTds30d" | "name";

export type GetSocietyListParams = {
  page: number;
  limit: number;
  areaId?: number;
  sort?: SocietySort;
  dir?: "asc" | "desc";
  search?: string;
};

export type SocietyListRow = {
  societyId: number;
  societyName: string;
  areaId: number;
  areaName: string;
  totalFlats: number;
  subscribed: number;
  penetrationPct: number;
  onboardedDate: string;
  openTickets: number;
  avgTds30d: number;
};

export type SocietyListResult = {
  rows: SocietyListRow[];
  total: number;
};

export type GrowthTrendPoint = {
  /** `YYYY-MM` */
  month: string;
  /** Cumulative active households per area (top 8 areas + "Other"). */
  [area: string]: number | string;
};

export type AreaPenetrationRow = {
  areaId: number;
  area: string;
  households: number;
  totalFlats: number;
  penetrationPct: number;
  infraAgeYears: number;
  ticketsPer100: number;
};

export type SocietyDetail = {
  society: {
    id: number;
    name: string;
    areaName: string;
    totalFlats: number;
    onboardedDate: string;
  };
  subscribed: number;
  penetrationPct: number;
  openTickets: number;
  avgTds30d: number | null;
  planBreakdown: { plan: PlanName; count: number }[];
  topRisk: {
    householdId: number;
    flatNumber: string;
    residentName: string;
    riskScore: number;
    tenureDays: number;
  }[];
};

const TOP_AREAS = 8;

export async function getSocietiesKpis(db: Database): Promise<SocietiesKpis> {
  const [[societyRow], [householdRow]] = await Promise.all([
    db
      .select({
        total: count(),
        flats: sql<number>`coalesce(sum(${societies.totalFlats}), 0)`.mapWith(Number),
        areas: countDistinct(societies.areaId),
      })
      .from(societies),
    db.select({ active: count() }).from(households).where(eq(households.status, "active")),
  ]);

  const flats = societyRow?.flats ?? 0;
  const active = householdRow?.active ?? 0;

  return {
    societies: societyRow?.total ?? 0,
    avgPenetration: toPercent(active, flats),
    flatsCovered: flats,
    areas: societyRow?.areas ?? 0,
  };
}

export async function getSocietyList(db: Database, params: GetSocietyListParams): Promise<SocietyListResult> {
  const thirtyDaysAgo = startOfDay(addDays(new Date(), -30));

  const subscribedAgg = db
    .select({ societyId: households.societyId, total: count().as("total") })
    .from(households)
    .where(eq(households.status, "active"))
    .groupBy(households.societyId)
    .as("subscribed_agg");

  const ticketAgg = db
    .select({ societyId: households.societyId, total: count().as("total") })
    .from(serviceTickets)
    .innerJoin(households, eq(serviceTickets.householdId, households.id))
    .where(sql`${serviceTickets.status} <> 'resolved'`)
    .groupBy(households.societyId)
    .as("ticket_agg");

  const tdsAgg = db
    .select({
      societyId: households.societyId,
      avgTds: sql<number>`avg(${readings.tdsPpm})`.mapWith(Number).as("avg_tds"),
    })
    .from(readings)
    .innerJoin(dispensers, eq(readings.dispenserId, dispensers.id))
    .innerJoin(households, eq(dispensers.householdId, households.id))
    .where(gte(readings.recordedAt, thirtyDaysAgo))
    .groupBy(households.societyId)
    .as("tds_agg");

  const subscribedExpr = sql<number>`coalesce(${subscribedAgg.total}, 0)`.mapWith(Number);
  const openTicketsExpr = sql<number>`coalesce(${ticketAgg.total}, 0)`.mapWith(Number);
  const avgTdsExpr = sql<number>`coalesce(${tdsAgg.avgTds}, 0)`.mapWith(Number);
  const penetrationExpr =
    sql<number>`(100.0 * coalesce(${subscribedAgg.total}, 0) / nullif(${societies.totalFlats}, 0))`.mapWith(Number);

  const conditions = [
    params.areaId ? eq(societies.areaId, params.areaId) : undefined,
    params.search ? ilike(societies.name, `%${params.search}%`) : undefined,
  ];

  const sortMap = {
    penetration: penetrationExpr,
    subscribed: subscribedExpr,
    totalFlats: societies.totalFlats,
    openTickets: openTicketsExpr,
    avgTds30d: avgTdsExpr,
    name: societies.name,
  } as const;
  const sortExpr = sortMap[params.sort ?? "penetration"];
  const direction = params.dir ?? (params.sort === "name" ? "asc" : "desc");

  const [rows, [totals]] = await Promise.all([
    db
      .select({
        societyId: societies.id,
        societyName: societies.name,
        areaId: areas.id,
        areaName: areas.name,
        totalFlats: societies.totalFlats,
        subscribed: subscribedExpr,
        penetrationPct: penetrationExpr,
        onboardedDate: societies.onboardedDate,
        openTickets: openTicketsExpr,
        avgTds30d: avgTdsExpr,
      })
      .from(societies)
      .innerJoin(areas, eq(societies.areaId, areas.id))
      .leftJoin(subscribedAgg, eq(subscribedAgg.societyId, societies.id))
      .leftJoin(ticketAgg, eq(ticketAgg.societyId, societies.id))
      .leftJoin(tdsAgg, eq(tdsAgg.societyId, societies.id))
      .where(and(...conditions))
      .orderBy(direction === "asc" ? asc(sortExpr) : desc(sortExpr), asc(societies.id))
      .limit(params.limit)
      .offset((params.page - 1) * params.limit),
    db
      .select({ total: count() })
      .from(societies)
      .where(and(...conditions)),
  ]);

  return {
    rows: rows.map((row) => ({
      ...row,
      penetrationPct: roundTo(row.penetrationPct),
      avgTds30d: roundTo(row.avgTds30d),
    })),
    total: totals?.total ?? 0,
  };
}

/** Cumulative active households per area over the last `months` months. */
export async function getGrowthTrend(db: Database, months = 24): Promise<GrowthTrendPoint[]> {
  const rows = await db
    .select({
      joinDate: households.joinDate,
      cancelDate: households.cancelDate,
      areaName: areas.name,
    })
    .from(households)
    .innerJoin(societies, eq(households.societyId, societies.id))
    .innerJoin(areas, eq(societies.areaId, areas.id));

  // Rank areas by all-time households; anything past the top N folds into "Other".
  const areaTotals = new Map<string, number>();
  for (const row of rows) {
    areaTotals.set(row.areaName, (areaTotals.get(row.areaName) ?? 0) + 1);
  }
  const topAreas = [...areaTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_AREAS)
    .map(([name]) => name);
  const topAreaSet = new Set(topAreas);

  return lastMonths(months).map(({ key, end }) => {
    const endKey = toDateKey(end);
    const point: GrowthTrendPoint = { month: key };
    for (const area of topAreas) point[area] = 0;
    point.Other = 0;

    for (const row of rows) {
      if (row.joinDate > endKey) continue;
      if (row.cancelDate !== null && row.cancelDate <= endKey) continue;
      const bucket = topAreaSet.has(row.areaName) ? row.areaName : "Other";
      point[bucket] = (point[bucket] as number) + 1;
    }

    return point;
  });
}

export async function getAreaPenetration(db: Database): Promise<AreaPenetrationRow[]> {
  const ninetyAgo = toDateKey(addDays(new Date(), -90));

  const [areaRows, householdRows, societyRows, ticketRows] = await Promise.all([
    db.select({ id: areas.id, name: areas.name, infraAgeYears: areas.infrastructureAgeYears }).from(areas),
    db
      .select({ areaId: societies.areaId, total: count() })
      .from(households)
      .innerJoin(societies, eq(households.societyId, societies.id))
      .where(eq(households.status, "active"))
      .groupBy(societies.areaId),
    db
      .select({
        areaId: societies.areaId,
        flats: sql<number>`coalesce(sum(${societies.totalFlats}), 0)`.mapWith(Number),
      })
      .from(societies)
      .groupBy(societies.areaId),
    db
      .select({ areaId: societies.areaId, total: count() })
      .from(serviceTickets)
      .innerJoin(households, eq(serviceTickets.householdId, households.id))
      .innerJoin(societies, eq(households.societyId, societies.id))
      .where(gte(serviceTickets.raisedDate, ninetyAgo))
      .groupBy(societies.areaId),
  ]);

  const householdByArea = new Map(householdRows.map((row) => [row.areaId, row.total]));
  const flatsByArea = new Map(societyRows.map((row) => [row.areaId, row.flats]));
  const ticketByArea = new Map(ticketRows.map((row) => [row.areaId, row.total]));

  return areaRows
    .map((area) => {
      const householdsInArea = householdByArea.get(area.id) ?? 0;
      const totalFlats = flatsByArea.get(area.id) ?? 0;
      const tickets90d = ticketByArea.get(area.id) ?? 0;

      return {
        areaId: area.id,
        area: area.name,
        households: householdsInArea,
        totalFlats,
        penetrationPct: toPercent(householdsInArea, totalFlats),
        infraAgeYears: area.infraAgeYears,
        ticketsPer100: toPercent(tickets90d, householdsInArea),
      };
    })
    .sort((a, b) => b.penetrationPct - a.penetrationPct);
}

export async function getSocietyDetail(db: Database, societyId: number): Promise<SocietyDetail | null> {
  const thirtyDaysAgo = startOfDay(addDays(new Date(), -30));
  const todayKey = toDateKey(new Date());

  const [societyRow] = await db
    .select({
      id: societies.id,
      name: societies.name,
      areaName: areas.name,
      totalFlats: societies.totalFlats,
      onboardedDate: societies.onboardedDate,
    })
    .from(societies)
    .innerJoin(areas, eq(societies.areaId, areas.id))
    .where(eq(societies.id, societyId));

  if (!societyRow) return null;

  const [householdRow, ticketRow, tdsRow, planRows, topRiskRows] = await Promise.all([
    db
      .select({ active: count() })
      .from(households)
      .where(and(eq(households.societyId, societyId), eq(households.status, "active"))),
    db
      .select({ open: count() })
      .from(serviceTickets)
      .innerJoin(households, eq(serviceTickets.householdId, households.id))
      .where(and(eq(households.societyId, societyId), sql`${serviceTickets.status} <> 'resolved'`)),
    db
      .select({ avgTds: sql<number>`avg(${readings.tdsPpm})`.mapWith(Number) })
      .from(readings)
      .innerJoin(dispensers, eq(readings.dispenserId, dispensers.id))
      .innerJoin(households, eq(dispensers.householdId, households.id))
      .where(and(eq(households.societyId, societyId), gte(readings.recordedAt, thirtyDaysAgo))),
    db
      .select({ plan: plans.name, total: count() })
      .from(subscriptions)
      .innerJoin(plans, eq(plans.id, subscriptions.planId))
      .innerJoin(households, eq(subscriptions.householdId, households.id))
      .where(and(eq(households.societyId, societyId), eq(subscriptions.status, "active")))
      .groupBy(plans.name),
    db
      .select({
        householdId: households.id,
        flatNumber: households.flatNumber,
        residentName: households.residentName,
        riskScore: households.riskScore,
        tenureDays: sql<number>`(${todayKey}::date - ${households.joinDate})`.mapWith(Number),
      })
      .from(households)
      .where(and(eq(households.societyId, societyId), eq(households.status, "active")))
      .orderBy(desc(households.riskScore), desc(households.id))
      .limit(5),
  ]);

  const subscribed = householdRow[0]?.active ?? 0;
  const avgTds = tdsRow[0]?.avgTds;

  return {
    society: societyRow,
    subscribed,
    penetrationPct: toPercent(subscribed, societyRow.totalFlats),
    openTickets: ticketRow[0]?.open ?? 0,
    avgTds30d: avgTds === undefined || Number.isNaN(avgTds) ? null : roundTo(avgTds),
    planBreakdown: planRows.map((row) => ({ plan: row.plan, count: row.total })),
    topRisk: topRiskRows,
  };
}
