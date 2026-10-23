import type { Database } from "@/db";
import { and, count, eq, gte, isNotNull, lte, sql } from "drizzle-orm";

import { areas, dispensers, households, readings, serviceTickets, societies } from "@/db/schema";

import { addDays, daysBetween, roundTo, startOfDay, toDateKey, toPercent } from "./utils";

export type AreaDemandRow = {
  areaId: number;
  area: string;
  infraAgeYears: number;
  households: number;
  tickets90d: number;
  per100Households: number;
  avgResolutionDays: number;
};

export type PredictiveRow = {
  dispenserId: number;
  householdId: number;
  residentName: string;
  flatNumber: string;
  societyName: string;
  areaName: string;
  filterAgeDays: number;
  latestTds: number;
  /** Linear slope of the last 4–6 readings, % of the latest TDS per week (signed). */
  tdsSlope7d: number;
  reason: string;
};

export type HouseholdLite = {
  id: number;
  label: string;
  residentName: string;
  societyName: string;
  areaName: string;
};

const PREDICTIVE_LIMIT = 25;
const READINGS_WINDOW_DAYS = 30;
const MAX_READINGS_PER_DISPENSER = 6;
/** ppm/day - sustained growth beyond this is "rising fast". */
const SLOPE_TRIGGER_PPM_PER_DAY = 3.5;
const SLOPE_MIN_TDS = 250;
/** A filter older than this is due regardless of the TDS curve. */
const FILTER_AGE_TRIGGER_DAYS = 70;

/** Tickets 90d + households + infra age + resolution speed, per area. */
export async function getAreaDemand(db: Database): Promise<AreaDemandRow[]> {
  const ninetyAgo = toDateKey(addDays(new Date(), -90));

  const [areaRows, householdRows, ticketRows, resolutionRows] = await Promise.all([
    db.select({ id: areas.id, name: areas.name, infraAgeYears: areas.infrastructureAgeYears }).from(areas),
    db
      .select({ areaId: societies.areaId, total: count() })
      .from(households)
      .innerJoin(societies, eq(households.societyId, societies.id))
      .where(eq(households.status, "active"))
      .groupBy(societies.areaId),
    db
      .select({ areaId: societies.areaId, total: count() })
      .from(serviceTickets)
      .innerJoin(households, eq(serviceTickets.householdId, households.id))
      .innerJoin(societies, eq(households.societyId, societies.id))
      .where(gte(serviceTickets.raisedDate, ninetyAgo))
      .groupBy(societies.areaId),
    db
      .select({
        areaId: societies.areaId,
        avgDays: sql<number>`coalesce(avg(${serviceTickets.resolvedDate} - ${serviceTickets.raisedDate}), 0)`.mapWith(
          Number
        ),
      })
      .from(serviceTickets)
      .innerJoin(households, eq(serviceTickets.householdId, households.id))
      .innerJoin(societies, eq(households.societyId, societies.id))
      .where(and(gte(serviceTickets.raisedDate, ninetyAgo), isNotNull(serviceTickets.resolvedDate)))
      .groupBy(societies.areaId),
  ]);

  const householdByArea = new Map(householdRows.map((row) => [row.areaId, row.total]));
  const ticketByArea = new Map(ticketRows.map((row) => [row.areaId, row.total]));
  const resolutionByArea = new Map(resolutionRows.map((row) => [row.areaId, row.avgDays]));

  return areaRows
    .map((area) => {
      const householdsInArea = householdByArea.get(area.id) ?? 0;
      const tickets90d = ticketByArea.get(area.id) ?? 0;

      return {
        areaId: area.id,
        area: area.name,
        infraAgeYears: area.infraAgeYears,
        households: householdsInArea,
        tickets90d,
        per100Households: toPercent(tickets90d, householdsInArea),
        avgResolutionDays: roundTo(resolutionByArea.get(area.id) ?? 0),
      };
    })
    .sort((a, b) => b.per100Households - a.per100Households);
}

type DispenserReadings = {
  dispenserId: number;
  householdId: number;
  residentName: string;
  flatNumber: string;
  societyName: string;
  areaName: string;
  lastFilterChangeDate: string;
  readings: { tdsPpm: number; recordedAt: Date }[];
};

function linearSlope(points: { x: number; y: number }[]): number {
  if (points.length < 2) return 0;

  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;

  let covariance = 0;
  let variance = 0;
  for (const point of points) {
    covariance += (point.x - meanX) * (point.y - meanY);
    variance += (point.x - meanX) ** 2;
  }

  return variance === 0 ? 0 : covariance / variance;
}

/**
 * The predictive-service list: dispensers whose recent TDS trend is climbing
 * and/or whose filter is beyond its natural cycle, ranked by a composite score.
 * Reads the last 30 days of telemetry (index-friendly) and keeps the latest
 * six readings per dispenser - enough for an honest linear slope.
 */
export async function getPredictive(db: Database): Promise<PredictiveRow[]> {
  const now = new Date();
  const windowStart = startOfDay(addDays(now, -READINGS_WINDOW_DAYS));

  const ranked = db
    .select({
      dispenserId: readings.dispenserId,
      tdsPpm: readings.tdsPpm,
      recordedAt: readings.recordedAt,
      rank: sql<number>`row_number() over (partition by ${readings.dispenserId} order by ${readings.recordedAt} desc)`
        .mapWith(Number)
        .as("rank"),
    })
    .from(readings)
    .where(gte(readings.recordedAt, windowStart))
    .as("ranked_readings");

  const rows = await db
    .select({
      dispenserId: ranked.dispenserId,
      tdsPpm: ranked.tdsPpm,
      recordedAt: ranked.recordedAt,
      householdId: households.id,
      residentName: households.residentName,
      flatNumber: households.flatNumber,
      societyName: societies.name,
      areaName: areas.name,
      lastFilterChangeDate: dispensers.lastFilterChangeDate,
    })
    .from(ranked)
    .innerJoin(dispensers, eq(dispensers.id, ranked.dispenserId))
    .innerJoin(households, eq(dispensers.householdId, households.id))
    .innerJoin(societies, eq(households.societyId, societies.id))
    .innerJoin(areas, eq(societies.areaId, areas.id))
    .where(lte(ranked.rank, MAX_READINGS_PER_DISPENSER))
    .orderBy(ranked.dispenserId, ranked.recordedAt);

  const byDispenser = new Map<number, DispenserReadings>();
  for (const row of rows) {
    let entry = byDispenser.get(row.dispenserId);
    if (!entry) {
      entry = {
        dispenserId: row.dispenserId,
        householdId: row.householdId,
        residentName: row.residentName,
        flatNumber: row.flatNumber,
        societyName: row.societyName,
        areaName: row.areaName,
        lastFilterChangeDate: row.lastFilterChangeDate,
        readings: [],
      };
      byDispenser.set(row.dispenserId, entry);
    }
    entry.readings.push({ tdsPpm: row.tdsPpm, recordedAt: row.recordedAt });
  }

  const candidates: { row: PredictiveRow; score: number }[] = [];

  for (const entry of byDispenser.values()) {
    const points = entry.readings;
    if (points.length === 0) continue;

    const latest = points[points.length - 1];
    const firstAt = points[0].recordedAt.getTime();
    const slopePpmPerDay = linearSlope(
      points.map((point) => ({
        x: (point.recordedAt.getTime() - firstAt) / 86_400_000,
        y: point.tdsPpm,
      }))
    );
    const tdsSlope7d = latest.tdsPpm > 0 ? roundTo(((slopePpmPerDay * 7) / latest.tdsPpm) * 100) : 0;
    const filterAgeDays = Math.max(0, daysBetween(new Date(`${entry.lastFilterChangeDate}T00:00:00`), startOfDay(now)));

    const tdsRising = slopePpmPerDay >= SLOPE_TRIGGER_PPM_PER_DAY && latest.tdsPpm >= SLOPE_MIN_TDS;
    const filterOld = filterAgeDays >= FILTER_AGE_TRIGGER_DAYS;
    if (!tdsRising && !filterOld) continue;

    const reasons = [
      tdsRising ? `TDS rising ${Math.round(tdsSlope7d)}%/wk` : null,
      filterOld ? `filter ${filterAgeDays}d old` : null,
    ].filter((reason): reason is string => reason !== null);

    candidates.push({
      row: {
        dispenserId: entry.dispenserId,
        householdId: entry.householdId,
        residentName: entry.residentName,
        flatNumber: entry.flatNumber,
        societyName: entry.societyName,
        areaName: entry.areaName,
        filterAgeDays,
        latestTds: latest.tdsPpm,
        tdsSlope7d,
        reason: reasons.join(" · "),
      },
      score: latest.tdsPpm + slopePpmPerDay * 10 + filterAgeDays * 2,
    });
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, PREDICTIVE_LIMIT)
    .map((candidate) => candidate.row);
}

/** Flat active-household list for pickers (ticket creation, etc.). */
export async function getHouseholdsLite(db: Database): Promise<HouseholdLite[]> {
  const rows = await db
    .select({
      id: households.id,
      flatNumber: households.flatNumber,
      residentName: households.residentName,
      societyName: societies.name,
      areaName: areas.name,
    })
    .from(households)
    .innerJoin(societies, eq(households.societyId, societies.id))
    .innerJoin(areas, eq(societies.areaId, areas.id))
    .where(eq(households.status, "active"))
    .orderBy(societies.name, households.flatNumber);

  return rows.map((row) => ({
    id: row.id,
    label: `${row.flatNumber} · ${row.societyName}`,
    residentName: row.residentName,
    societyName: row.societyName,
    areaName: row.areaName,
  }));
}
