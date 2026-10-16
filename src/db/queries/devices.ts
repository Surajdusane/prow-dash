import type { Database } from "@/db";
import { and, count, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";

import { areas, dispensers, households, readings, societies } from "@/db/schema";

import { addDays, asNumber, daysBetween, roundTo, startOfDay, toDateKey, toPercent } from "./utils";

export type DispenserType = "own_device" | "standard" | "premium";
export type FleetFlag = "offline" | "tds_high" | "purity_low" | "filter_due" | null;
export type AnomalySeverity = "high" | "medium";

export type GetFleetParams = {
  page: number;
  limit: number;
  areaId?: number;
  type?: DispenserType;
  online?: boolean;
};

export type FleetRow = {
  dispenserId: number;
  type: DispenserType;
  isOnline: boolean;
  installDate: string;
  lastFilterChangeDate: string;
  filterAgeDays: number;
  householdId: number;
  residentName: string;
  flatNumber: string;
  societyId: number;
  societyName: string;
  areaId: number;
  areaName: string;
  lastReadingAt: Date | null;
  latestTds: number | null;
  latestPh: number | null;
  latestPurity: number | null;
  flag: FleetFlag;
};

export type FleetResult = {
  rows: FleetRow[];
  total: number;
};

export type GetReadingsParams = {
  dispenserId: number;
  days: 30 | 90;
};

export type ReadingsResult = {
  dispenser: {
    id: number;
    type: DispenserType;
    isOnline: boolean;
    installDate: string;
    lastFilterChangeDate: string;
    householdId: number;
    residentName: string;
    flatNumber: string;
    societyName: string;
    areaName: string;
  };
  readings: { recordedAt: Date; tdsPpm: number; ph: number; purityPct: number }[];
};

export type AnomalyRow = {
  dispenserId: number;
  householdId: number;
  residentName: string;
  flatNumber: string;
  societyName: string;
  areaId: number;
  areaName: string;
  type: DispenserType;
  isOnline: boolean;
  lastReadingAt: Date | null;
  latestTds: number | null;
  latestPurity: number | null;
  staleDays: number | null;
  severity: AnomalySeverity;
  reasons: string[];
};

export type FleetStats = {
  onlinePct: number;
  avgPurity7d: number;
  needsServiceCount: number;
  offlineCount: number;
};

export type GetReadingsTrendParams = {
  days: 30 | 90;
};

export type ReadingsTrendPoint = {
  /** `YYYY-MM-DD` — stable chart x-axis key. */
  day: string;
  avgTds: number;
  avgPurity: number;
};

const READING_LOOKBACK_DAYS = 30;
const STALE_DAYS = 7;
/**
 * Filter due when older than the max natural cycle (60–75 days). The fleet
 * only covers active households — cancelled households' devices are collected.
 */
const SERVICE_DUE_DAYS = 75;
const ANOMALY_LIMIT = 100;
const TDS_FLAG_THRESHOLD = 450;
const PURITY_FLAG_THRESHOLD = 85;

/** Latest reading per dispenser, pre-filtered by recency then DISTINCT ON (index-friendly). */
function latestReadingsSubquery(db: Database, now: Date) {
  return db
    .selectDistinctOn([readings.dispenserId], {
      dispenserId: readings.dispenserId,
      recordedAt: readings.recordedAt,
      tdsPpm: readings.tdsPpm,
      ph: readings.ph,
      purityPct: readings.purityPct,
    })
    .from(readings)
    .where(gte(readings.recordedAt, startOfDay(addDays(now, -READING_LOOKBACK_DAYS))))
    .orderBy(readings.dispenserId, desc(readings.recordedAt))
    .as("latest_readings");
}

function deriveFlag(row: {
  isOnline: boolean;
  lastReadingAt: Date | null;
  latestTds: number | null;
  latestPurity: number | null;
  filterAgeDays: number;
}): FleetFlag {
  const stale = row.lastReadingAt === null || daysBetween(row.lastReadingAt, new Date()) > STALE_DAYS;
  if (!row.isOnline || stale) return "offline";
  if (row.latestTds !== null && row.latestTds > TDS_FLAG_THRESHOLD) return "tds_high";
  if (row.latestPurity !== null && row.latestPurity < PURITY_FLAG_THRESHOLD) return "purity_low";
  if (row.filterAgeDays > SERVICE_DUE_DAYS) return "filter_due";
  return null;
}

export async function getFleet(db: Database, params: GetFleetParams): Promise<FleetResult> {
  const now = new Date();
  const todayKey = toDateKey(now);
  const filterAgeExpr = sql<number>`(${todayKey}::date - ${dispensers.lastFilterChangeDate})`.mapWith(Number);
  const latest = latestReadingsSubquery(db, now);

  const conditions = [
    eq(households.status, "active"),
    params.areaId ? eq(areas.id, params.areaId) : undefined,
    params.type ? eq(dispensers.type, params.type) : undefined,
    params.online !== undefined ? eq(dispensers.isOnline, params.online) : undefined,
  ];

  const [rows, [totals]] = await Promise.all([
    db
      .select({
        dispenserId: dispensers.id,
        type: dispensers.type,
        isOnline: dispensers.isOnline,
        installDate: dispensers.installDate,
        lastFilterChangeDate: dispensers.lastFilterChangeDate,
        filterAgeDays: filterAgeExpr,
        householdId: households.id,
        residentName: households.residentName,
        flatNumber: households.flatNumber,
        societyId: societies.id,
        societyName: societies.name,
        areaId: areas.id,
        areaName: areas.name,
        lastReadingAt: latest.recordedAt,
        latestTds: latest.tdsPpm,
        latestPh: latest.ph,
        latestPurity: latest.purityPct,
      })
      .from(dispensers)
      .innerJoin(households, eq(dispensers.householdId, households.id))
      .innerJoin(societies, eq(households.societyId, societies.id))
      .innerJoin(areas, eq(societies.areaId, areas.id))
      .leftJoin(latest, eq(latest.dispenserId, dispensers.id))
      .where(and(...conditions))
      .orderBy(desc(filterAgeExpr), desc(dispensers.id))
      .limit(params.limit)
      .offset((params.page - 1) * params.limit),
    db
      .select({ total: count() })
      .from(dispensers)
      .innerJoin(households, eq(dispensers.householdId, households.id))
      .innerJoin(societies, eq(households.societyId, societies.id))
      .innerJoin(areas, eq(societies.areaId, areas.id))
      .where(and(...conditions)),
  ]);

  return {
    rows: rows.map((row) => {
      const latestPurity = asNumber(row.latestPurity);
      return {
        ...row,
        latestPh: asNumber(row.latestPh),
        latestPurity,
        flag: deriveFlag({ ...row, latestPurity }),
      };
    }),
    total: totals?.total ?? 0,
  };
}

/** Readings window for the selected device, ascending so charts read left→right. */
export async function getReadings(db: Database, params: GetReadingsParams): Promise<ReadingsResult | null> {
  const since = startOfDay(addDays(new Date(), -params.days));

  const [dispenserRow] = await db
    .select({
      id: dispensers.id,
      type: dispensers.type,
      isOnline: dispensers.isOnline,
      installDate: dispensers.installDate,
      lastFilterChangeDate: dispensers.lastFilterChangeDate,
      householdId: households.id,
      residentName: households.residentName,
      flatNumber: households.flatNumber,
      societyName: societies.name,
      areaName: areas.name,
    })
    .from(dispensers)
    .innerJoin(households, eq(dispensers.householdId, households.id))
    .innerJoin(societies, eq(households.societyId, societies.id))
    .innerJoin(areas, eq(societies.areaId, areas.id))
    .where(eq(dispensers.id, params.dispenserId));

  if (!dispenserRow) return null;

  const rows = await db
    .select({
      recordedAt: readings.recordedAt,
      tdsPpm: readings.tdsPpm,
      ph: readings.ph,
      purityPct: readings.purityPct,
    })
    .from(readings)
    .where(and(eq(readings.dispenserId, params.dispenserId), gte(readings.recordedAt, since)))
    .orderBy(readings.recordedAt);

  return {
    dispenser: dispenserRow,
    readings: rows.map((row) => ({
      recordedAt: row.recordedAt,
      tdsPpm: row.tdsPpm,
      ph: asNumber(row.ph) ?? 0,
      purityPct: asNumber(row.purityPct) ?? 0,
    })),
  };
}

/**
 * Fleet-wide daily telemetry averages. Readings land every 2–3 days per
 * dispenser, so one bucket per day across the whole fleet reads as a smooth
 * trend line instead of a per-device zig-zag.
 */
export async function getReadingsTrend(db: Database, params: GetReadingsTrendParams): Promise<ReadingsTrendPoint[]> {
  const since = startOfDay(addDays(new Date(), -params.days));
  const dayExpr = sql<string>`to_char(date_trunc('day', ${readings.recordedAt}), 'YYYY-MM-DD')`;

  const rows = await db
    .select({
      day: dayExpr,
      avgTds: sql<number>`coalesce(avg(${readings.tdsPpm}), 0)`.mapWith(Number),
      avgPurity: sql<number>`coalesce(avg(${readings.purityPct}), 0)`.mapWith(Number),
    })
    .from(readings)
    .where(gte(readings.recordedAt, since))
    .groupBy(dayExpr)
    .orderBy(dayExpr);

  return downsampleTrend(
    rows.map((row) => ({
      day: row.day,
      avgTds: Math.round(row.avgTds),
      avgPurity: roundTo(row.avgPurity),
    }))
  );
}

/** Chart budget: keep trend payloads at or under 60 points (a 90-day window lands ~90 daily buckets). */
const TREND_MAX_POINTS = 60;

/**
 * Folds a long daily series into evenly sized averaged buckets — the last
 * point of each bucket labels it — so a 90-day window renders at ~45 points
 * without changing the trend's shape.
 */
function downsampleTrend(points: ReadingsTrendPoint[]): ReadingsTrendPoint[] {
  if (points.length <= TREND_MAX_POINTS) return points;

  const bucketSize = Math.ceil(points.length / TREND_MAX_POINTS);
  const result: ReadingsTrendPoint[] = [];

  for (let index = 0; index < points.length; index += bucketSize) {
    const bucket = points.slice(index, index + bucketSize);
    const last = bucket[bucket.length - 1]!;
    const avgTds = bucket.reduce((sum, point) => sum + point.avgTds, 0) / bucket.length;
    const avgPurity = bucket.reduce((sum, point) => sum + point.avgPurity, 0) / bucket.length;

    result.push({ day: last.day, avgTds: Math.round(avgTds), avgPurity: roundTo(avgPurity) });
  }

  return result;
}

/**
 * Anomaly feed: latest reading per dispenser with TDS > 450, purity < 85 or a
 * device that has gone quiet. Severity is derived and the list is capped.
 */
export async function getAnomalies(db: Database): Promise<AnomalyRow[]> {
  const now = new Date();
  const sevenDaysAgo = startOfDay(addDays(now, -STALE_DAYS));
  const latest = latestReadingsSubquery(db, now);

  const rows = await db
    .select({
      dispenserId: dispensers.id,
      householdId: households.id,
      residentName: households.residentName,
      flatNumber: households.flatNumber,
      societyName: societies.name,
      areaId: areas.id,
      areaName: areas.name,
      type: dispensers.type,
      isOnline: dispensers.isOnline,
      lastReadingAt: latest.recordedAt,
      latestTds: latest.tdsPpm,
      latestPurity: latest.purityPct,
    })
    .from(dispensers)
    .innerJoin(households, eq(dispensers.householdId, households.id))
    .innerJoin(societies, eq(households.societyId, societies.id))
    .innerJoin(areas, eq(societies.areaId, areas.id))
    .leftJoin(latest, eq(latest.dispenserId, dispensers.id))
    .where(
      and(
        eq(households.status, "active"),
        or(
          eq(dispensers.isOnline, false),
          isNull(latest.recordedAt),
          lte(latest.recordedAt, sevenDaysAgo),
          sql`${latest.tdsPpm} > ${TDS_FLAG_THRESHOLD}`,
          sql`${latest.purityPct} < ${PURITY_FLAG_THRESHOLD}`
        )
      )
    )
    .orderBy(sql`${latest.tdsPpm} desc nulls last`, desc(dispensers.id))
    .limit(500);

  const anomalies: AnomalyRow[] = rows.map((row) => {
    const latestPurity = asNumber(row.latestPurity);
    const staleDays = row.lastReadingAt === null ? null : daysBetween(row.lastReadingAt, now);
    const reasons: string[] = [];

    if (!row.isOnline) reasons.push("device offline");
    if (staleDays !== null && staleDays > STALE_DAYS) reasons.push(`no readings ${staleDays}d`);
    if (row.lastReadingAt === null) reasons.push("never reported");
    if (row.latestTds !== null && row.latestTds > TDS_FLAG_THRESHOLD) reasons.push(`TDS ${row.latestTds} ppm`);
    if (latestPurity !== null && latestPurity < PURITY_FLAG_THRESHOLD) reasons.push(`purity ${latestPurity}%`);

    const severity: AnomalySeverity =
      (row.latestTds !== null && row.latestTds > 500) ||
      (latestPurity !== null && latestPurity < 84) ||
      (staleDays !== null && staleDays > 14)
        ? "high"
        : "medium";

    return { ...row, latestPurity, staleDays, severity, reasons };
  });

  const severityRank: Record<AnomalySeverity, number> = { high: 0, medium: 1 };
  return anomalies
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || (b.latestTds ?? 0) - (a.latestTds ?? 0))
    .slice(0, ANOMALY_LIMIT);
}

export async function getFleetStats(db: Database): Promise<FleetStats> {
  const now = new Date();
  const sevenDaysAgo = startOfDay(addDays(now, -STALE_DAYS));
  const serviceDueKey = toDateKey(addDays(now, -SERVICE_DUE_DAYS));
  const latest = latestReadingsSubquery(db, now);

  const [fleetRow, purityRow] = await Promise.all([
    db
      .select({
        total: count(),
        online: sql<number>`count(*) filter (where ${dispensers.isOnline})`.mapWith(Number),
        offline:
          sql<number>`count(*) filter (where ${dispensers.isOnline} = false or ${latest.recordedAt} is null or ${latest.recordedAt} < ${sevenDaysAgo})`.mapWith(
            Number
          ),
        needsService:
          sql<number>`count(*) filter (where ${dispensers.lastFilterChangeDate} < ${serviceDueKey} or ${latest.tdsPpm} > ${TDS_FLAG_THRESHOLD} or ${latest.purityPct} < ${PURITY_FLAG_THRESHOLD})`.mapWith(
            Number
          ),
      })
      .from(dispensers)
      .innerJoin(households, eq(dispensers.householdId, households.id))
      .leftJoin(latest, eq(latest.dispenserId, dispensers.id))
      .where(eq(households.status, "active")),
    db
      .select({ avgPurity: sql<number>`coalesce(avg(${readings.purityPct}), 0)`.mapWith(Number) })
      .from(readings)
      .where(gte(readings.recordedAt, startOfDay(addDays(now, -7)))),
  ]);

  const total = fleetRow[0]?.total ?? 0;
  const online = fleetRow[0]?.online ?? 0;

  return {
    onlinePct: toPercent(online, total),
    avgPurity7d: roundTo(purityRow[0]?.avgPurity ?? 0),
    needsServiceCount: fleetRow[0]?.needsService ?? 0,
    offlineCount: fleetRow[0]?.offline ?? 0,
  };
}
