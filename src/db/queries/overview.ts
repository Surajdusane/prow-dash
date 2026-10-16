import type { Database } from "@/db";
import { count, eq, gte, inArray, sql } from "drizzle-orm";

import { areas, dispensers, households, plans, readings, serviceTickets, societies, subscriptions } from "@/db/schema";

import { getBillingTrend, type BillingTrendPoint } from "./payments";
import type { PlanName } from "./plans";
import { addDays, lastMonths, roundTo, startOfDay, startOfMonth, toDateKey, toPercent } from "./utils";

export type OverviewKpis = {
  activeHouseholds: number;
  mrr: number;
  /** 90-day churn % — cancellations ÷ households active at the start of the window. */
  churnRate90d: number;
  openTickets: number;
  newThisMonth: number;
  avgPurity7d: number;
};

export type HouseholdGrowthPoint = {
  /** `YYYY-MM` */
  month: string;
  active: number;
  cancelled: number;
};

export type PlanMixSlice = {
  plan: PlanName;
  count: number;
  /** Share of active subscriptions, 0–100. */
  share: number;
};

export type AreaHealthRow = {
  areaId: number;
  area: string;
  households: number;
  openTickets: number;
  avgTds30d: number | null;
  slaMetPct90d: number | null;
};

export async function getOverviewKpis(db: Database): Promise<OverviewKpis> {
  const now = new Date();
  const ninetyAgo = toDateKey(addDays(now, -90));
  const monthStart = toDateKey(startOfMonth(now));
  const sevenDaysAgo = startOfDay(addDays(now, -7));

  const [householdRow, revenueRow, ticketRow, purityRow] = await Promise.all([
    db
      .select({
        active: sql<number>`count(*) filter (where ${households.status} = 'active')`.mapWith(Number),
        newThisMonth: sql<number>`count(*) filter (where ${households.joinDate} >= ${monthStart})`.mapWith(Number),
        churned:
          sql<number>`count(*) filter (where ${households.cancelDate} is not null and ${households.cancelDate} > ${ninetyAgo})`.mapWith(
            Number
          ),
        activeAtStart:
          sql<number>`count(*) filter (where ${households.joinDate} <= ${ninetyAgo} and (${households.cancelDate} is null or ${households.cancelDate} > ${ninetyAgo}))`.mapWith(
            Number
          ),
      })
      .from(households),
    db
      .select({ mrr: sql<number>`coalesce(sum(${plans.monthlyPrice}), 0)`.mapWith(Number) })
      .from(subscriptions)
      .innerJoin(plans, eq(plans.id, subscriptions.planId))
      .where(eq(subscriptions.status, "active")),
    db
      .select({ open: count() })
      .from(serviceTickets)
      .where(inArray(serviceTickets.status, ["open", "in_progress"])),
    db
      .select({ avgPurity: sql<number>`coalesce(avg(${readings.purityPct}), 0)`.mapWith(Number) })
      .from(readings)
      .where(gte(readings.recordedAt, sevenDaysAgo)),
  ]);

  const activeAtStart = householdRow[0]?.activeAtStart ?? 0;
  const churned = householdRow[0]?.churned ?? 0;

  return {
    activeHouseholds: householdRow[0]?.active ?? 0,
    mrr: revenueRow[0]?.mrr ?? 0,
    churnRate90d: toPercent(churned, activeAtStart),
    openTickets: Number(ticketRow[0]?.open ?? 0),
    newThisMonth: householdRow[0]?.newThisMonth ?? 0,
    avgPurity7d: roundTo(purityRow[0]?.avgPurity ?? 0),
  };
}

/** Billed vs collected per billing month — the overview version of the revenue chart. */
export async function getRevenueTrend(db: Database, months = 18): Promise<BillingTrendPoint[]> {
  return getBillingTrend(db, months);
}

/**
 * Cumulative household growth per month end. The whole book is ~1.2k rows, so
 * shaping it in TS beats 24 round-trips of correlated aggregates.
 */
export async function getHouseholdGrowth(db: Database, months = 24): Promise<HouseholdGrowthPoint[]> {
  const rows = await db.select({ joinDate: households.joinDate, cancelDate: households.cancelDate }).from(households);

  return lastMonths(months).map(({ key, end }) => {
    const endKey = toDateKey(end);
    let active = 0;
    let cancelled = 0;

    for (const row of rows) {
      if (row.joinDate > endKey) continue;
      if (row.cancelDate !== null && row.cancelDate <= endKey) cancelled += 1;
      else active += 1;
    }

    return { month: key, active, cancelled };
  });
}

export async function getPlanMix(db: Database): Promise<PlanMixSlice[]> {
  const rows = await db
    .select({ plan: plans.name, total: count() })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(eq(subscriptions.status, "active"))
    .groupBy(plans.name);

  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return rows
    .map((row) => ({
      plan: row.plan,
      count: row.total,
      share: toPercent(row.total, total),
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getAreaHealth(db: Database): Promise<AreaHealthRow[]> {
  const thirtyDaysAgo = startOfDay(addDays(new Date(), -30));
  const ninetyAgo = toDateKey(addDays(new Date(), -90));

  const [areaRows, householdRows, ticketRows, tdsRows, slaRows] = await Promise.all([
    db.select({ id: areas.id, name: areas.name }).from(areas),
    // Active households per area
    db
      .select({ areaId: societies.areaId, total: count() })
      .from(households)
      .innerJoin(societies, eq(households.societyId, societies.id))
      .where(eq(households.status, "active"))
      .groupBy(societies.areaId),
    // Open tickets per area
    db
      .select({ areaId: societies.areaId, total: count() })
      .from(serviceTickets)
      .innerJoin(households, eq(serviceTickets.householdId, households.id))
      .innerJoin(societies, eq(households.societyId, societies.id))
      .where(inArray(serviceTickets.status, ["open", "in_progress"]))
      .groupBy(societies.areaId),
    // Fleet avg TDS per area (last 30d)
    db
      .select({ areaId: societies.areaId, avgTds: sql<number>`avg(${readings.tdsPpm})`.mapWith(Number) })
      .from(readings)
      .innerJoin(dispensers, eq(dispensers.id, readings.dispenserId))
      .innerJoin(households, eq(dispensers.householdId, households.id))
      .innerJoin(societies, eq(households.societyId, societies.id))
      .where(gte(readings.recordedAt, thirtyDaysAgo))
      .groupBy(societies.areaId),
    // SLA met % per area (tickets raised in last 90d, resolved)
    db
      .select({
        areaId: societies.areaId,
        slaMet: sql<number>`count(*) filter (where ${serviceTickets.slaMet} = true)`.mapWith(Number),
        resolved: sql<number>`count(*) filter (where ${serviceTickets.slaMet} is not null)`.mapWith(Number),
      })
      .from(serviceTickets)
      .innerJoin(households, eq(serviceTickets.householdId, households.id))
      .innerJoin(societies, eq(households.societyId, societies.id))
      .where(gte(serviceTickets.raisedDate, ninetyAgo))
      .groupBy(societies.areaId),
  ]);

  const householdByArea = new Map(householdRows.map((row) => [row.areaId, row.total]));
  const ticketByArea = new Map(ticketRows.map((row) => [row.areaId, row.total]));
  const tdsByArea = new Map(tdsRows.map((row) => [row.areaId, row.avgTds]));
  const slaByArea = new Map(slaRows.map((row) => [row.areaId, row]));

  return areaRows
    .map((area) => {
      const sla = slaByArea.get(area.id);
      return {
        areaId: area.id,
        area: area.name,
        households: householdByArea.get(area.id) ?? 0,
        openTickets: ticketByArea.get(area.id) ?? 0,
        avgTds30d: tdsByArea.has(area.id) ? roundTo(tdsByArea.get(area.id)!) : null,
        slaMetPct90d: sla && sla.resolved > 0 ? toPercent(sla.slaMet, sla.resolved) : null,
      };
    })
    .sort((a, b) => b.households - a.households);
}
