import type { Database } from "@/db";
import { and, asc, count, desc, eq, gte, inArray, lt, max, sql } from "drizzle-orm";

import {
  areas,
  complaints,
  dispensers,
  households,
  payments,
  plans,
  readings,
  serviceTickets,
  societies,
  subscriptions,
  technicians,
} from "@/db/schema";

import { getHouseholdComplaints, type ComplaintRow } from "./complaints";
import type { PlanName } from "./plans";
import { RISK_BAND_THRESHOLDS, type RiskBand } from "./risk";
import { addDays, addMonths, asNumber, lastMonths, startOfDay, startOfMonth, toDateKey } from "./utils";

export type RiskSort = "risk" | "tenure" | "complaints" | "latePayments" | "joinDate";
export type HouseholdStatus = "active" | "cancelled";

export type GetRiskTableParams = {
  page: number;
  limit: number;
  sort?: RiskSort;
  dir?: "asc" | "desc";
  riskBand?: RiskBand;
  areaId?: number;
  status?: HouseholdStatus;
};

export type RiskTableRow = {
  householdId: number;
  residentName: string;
  flatNumber: string;
  societyName: string;
  areaId: number;
  areaName: string;
  planName: PlanName | null;
  tenureDays: number;
  riskScore: number;
  complaints90d: number;
  latePayments6mo: number;
  lastComplaintDate: string | null;
  status: HouseholdStatus;
};

export type RiskTableResult = {
  rows: RiskTableRow[];
  total: number;
};

export type RiskDistributionRow = {
  band: RiskBand;
  count: number;
  /** Share of active households, 0–100. */
  share: number;
};

export type ComplaintTrendPoint = {
  /** `YYYY-MM` */
  month: string;
  water_quality: number;
  service_delay: number;
  billing: number;
  device_malfunction: number;
  other: number;
};

export type HouseholdProfile = {
  household: {
    id: number;
    residentName: string;
    flatNumber: string;
    phone: string | null;
    joinDate: string;
    status: HouseholdStatus;
    cancelDate: string | null;
    riskScore: number;
    societyName: string;
    areaName: string;
  };
  subscription: {
    id: number;
    planName: PlanName;
    monthlyPrice: number;
    startDate: string;
    endDate: string | null;
    status: "active" | "cancelled" | "paused";
  } | null;
  dispenser: {
    id: number;
    type: "own_device" | "standard" | "premium";
    installDate: string;
    lastFilterChangeDate: string;
    isOnline: boolean;
  } | null;
  readings: { recordedAt: Date; tdsPpm: number; ph: number; purityPct: number }[];
  tickets: {
    id: number;
    type: "filter_change" | "repair" | "installation" | "inspection";
    status: "open" | "in_progress" | "resolved";
    raisedDate: string;
    resolvedDate: string | null;
    slaMet: boolean | null;
    technicianName: string | null;
  }[];
  complaints: ComplaintRow[];
  payments: {
    id: number;
    billingMonth: string;
    amount: number;
    status: "paid" | "late" | "failed" | "pending";
    paidDate: string | null;
  }[];
};

function riskBandCondition(band: RiskBand) {
  if (band === "low") return lt(households.riskScore, RISK_BAND_THRESHOLDS.medium);
  if (band === "medium") {
    return and(
      gte(households.riskScore, RISK_BAND_THRESHOLDS.medium),
      lt(households.riskScore, RISK_BAND_THRESHOLDS.high)
    );
  }
  return gte(households.riskScore, RISK_BAND_THRESHOLDS.high);
}

export async function getRiskTable(db: Database, params: GetRiskTableParams): Promise<RiskTableResult> {
  const now = new Date();
  const todayKey = toDateKey(now);
  const ninetyAgo = toDateKey(addDays(now, -90));
  const sixMonthsAgo = toDateKey(startOfMonth(addMonths(now, -5)));

  // 90-day complaint aggregates per household
  const complaintsAgg = db
    .select({
      householdId: complaints.householdId,
      total: count().as("total"),
      lastDate: max(complaints.date).as("last_date"),
    })
    .from(complaints)
    .where(gte(complaints.date, ninetyAgo))
    .groupBy(complaints.householdId)
    .as("complaints_agg");

  // 6-month late/failed payment aggregates per household
  const paymentsAgg = db
    .select({ householdId: payments.householdId, total: count().as("total") })
    .from(payments)
    .where(and(gte(payments.billingMonth, sixMonthsAgo), inArray(payments.status, ["late", "failed"])))
    .groupBy(payments.householdId)
    .as("payments_agg");

  // Plans come from the most recent subscription (households can churn and rejoin)
  const latestSubscription = db
    .selectDistinctOn([subscriptions.householdId], {
      householdId: subscriptions.householdId,
      planId: subscriptions.planId,
    })
    .from(subscriptions)
    .orderBy(subscriptions.householdId, desc(subscriptions.startDate))
    .as("latest_subscription");

  const tenureExpr = sql<number>`(${todayKey}::date - ${households.joinDate})`.mapWith(Number);
  const complaintsExpr = sql<number>`coalesce(${complaintsAgg.total}, 0)`.mapWith(Number);
  const latePaymentsExpr = sql<number>`coalesce(${paymentsAgg.total}, 0)`.mapWith(Number);

  const conditions = [
    params.riskBand ? riskBandCondition(params.riskBand) : undefined,
    params.areaId ? eq(societies.areaId, params.areaId) : undefined,
    params.status ? eq(households.status, params.status) : undefined,
  ];

  const sortMap = {
    risk: households.riskScore,
    tenure: tenureExpr,
    complaints: complaintsExpr,
    latePayments: latePaymentsExpr,
    joinDate: households.joinDate,
  } as const;
  const sortExpr = sortMap[params.sort ?? "risk"];
  const direction = params.dir ?? "desc";

  const [rows, [totals]] = await Promise.all([
    db
      .select({
        householdId: households.id,
        residentName: households.residentName,
        flatNumber: households.flatNumber,
        societyName: societies.name,
        areaId: areas.id,
        areaName: areas.name,
        planName: plans.name,
        tenureDays: tenureExpr,
        riskScore: households.riskScore,
        complaints90d: complaintsExpr,
        latePayments6mo: latePaymentsExpr,
        lastComplaintDate: complaintsAgg.lastDate,
        status: households.status,
      })
      .from(households)
      .innerJoin(societies, eq(households.societyId, societies.id))
      .innerJoin(areas, eq(societies.areaId, areas.id))
      .leftJoin(latestSubscription, eq(latestSubscription.householdId, households.id))
      .leftJoin(plans, eq(plans.id, latestSubscription.planId))
      .leftJoin(complaintsAgg, eq(complaintsAgg.householdId, households.id))
      .leftJoin(paymentsAgg, eq(paymentsAgg.householdId, households.id))
      .where(and(...conditions))
      .orderBy(direction === "asc" ? asc(sortExpr) : desc(sortExpr), desc(households.id))
      .limit(params.limit)
      .offset((params.page - 1) * params.limit),
    db
      .select({ total: count() })
      .from(households)
      .innerJoin(societies, eq(households.societyId, societies.id))
      .innerJoin(areas, eq(societies.areaId, areas.id))
      .where(and(...conditions)),
  ]);

  return { rows, total: totals?.total ?? 0 };
}

export type HouseholdKpis = {
  activeHouseholds: number;
  /** Active households with riskScore ≥ 67 (the "high" band). */
  highRiskCount: number;
  /** Households cancelled in the last 90 days. */
  churned90d: number;
  /** Average tenure of the active book, in days. */
  avgTenureDays: number;
};

/** Headline churn numbers for the Customers KPI row. */
export async function getHouseholdKpis(db: Database): Promise<HouseholdKpis> {
  const now = new Date();
  const todayKey = toDateKey(now);
  const ninetyAgo = toDateKey(addDays(now, -90));

  const [row] = await db
    .select({
      activeHouseholds: sql<number>`count(*) filter (where ${households.status} = 'active')`.mapWith(Number),
      highRiskCount:
        sql<number>`count(*) filter (where ${households.status} = 'active' and ${households.riskScore} >= ${RISK_BAND_THRESHOLDS.high})`.mapWith(
          Number
        ),
      churned90d:
        sql<number>`count(*) filter (where ${households.status} = 'cancelled' and ${households.cancelDate} >= ${ninetyAgo})`.mapWith(
          Number
        ),
      avgTenureDays:
        sql<number>`coalesce(avg(${todayKey}::date - ${households.joinDate}) filter (where ${households.status} = 'active'), 0)`.mapWith(
          Number
        ),
    })
    .from(households);

  return {
    activeHouseholds: row?.activeHouseholds ?? 0,
    highRiskCount: row?.highRiskCount ?? 0,
    churned90d: row?.churned90d ?? 0,
    avgTenureDays: Math.round(row?.avgTenureDays ?? 0),
  };
}

/** Risk-band split of the active book (drives the donut chart + high-risk KPI). */
export async function getRiskDistribution(db: Database): Promise<RiskDistributionRow[]> {
  const [row] = await db
    .select({
      low: sql<number>`count(*) filter (where ${households.riskScore} < ${RISK_BAND_THRESHOLDS.medium})`.mapWith(
        Number
      ),
      medium:
        sql<number>`count(*) filter (where ${households.riskScore} >= ${RISK_BAND_THRESHOLDS.medium} and ${households.riskScore} < ${RISK_BAND_THRESHOLDS.high})`.mapWith(
          Number
        ),
      high: sql<number>`count(*) filter (where ${households.riskScore} >= ${RISK_BAND_THRESHOLDS.high})`.mapWith(
        Number
      ),
    })
    .from(households)
    .where(eq(households.status, "active"));

  const low = row?.low ?? 0;
  const medium = row?.medium ?? 0;
  const high = row?.high ?? 0;
  const total = low + medium + high;
  const share = (value: number) => (total === 0 ? 0 : Math.round((value / total) * 1000) / 10);

  return [
    { band: "low" as const, count: low, share: share(low) },
    { band: "medium" as const, count: medium, share: share(medium) },
    { band: "high" as const, count: high, share: share(high) },
  ];
}

/** Complaint volume per month per category (last `months` months, zero-filled). */
export async function getComplaintTrend(db: Database, months = 12): Promise<ComplaintTrendPoint[]> {
  const monthExpr = sql<string>`to_char(date_trunc('month', ${complaints.date}), 'YYYY-MM')`;

  const rows = await db
    .select({ month: monthExpr, category: complaints.category, total: count() })
    .from(complaints)
    .groupBy(monthExpr, complaints.category);

  const windows = lastMonths(months);
  const byMonth = new Map<string, ComplaintTrendPoint>();
  for (const { key } of windows) {
    byMonth.set(key, {
      month: key,
      water_quality: 0,
      service_delay: 0,
      billing: 0,
      device_malfunction: 0,
      other: 0,
    });
  }
  for (const row of rows) {
    const point = byMonth.get(row.month);
    if (!point) continue;
    point[row.category] = row.total;
  }

  return windows.map(({ key }) => byMonth.get(key)!);
}

/** Full household profile for the customer drawer. */
export async function getHouseholdProfile(db: Database, householdId: number): Promise<HouseholdProfile | null> {
  const thirtyDaysAgo = startOfDay(addDays(new Date(), -30));

  const [householdRow] = await db
    .select({
      id: households.id,
      residentName: households.residentName,
      flatNumber: households.flatNumber,
      phone: households.phone,
      joinDate: households.joinDate,
      status: households.status,
      cancelDate: households.cancelDate,
      riskScore: households.riskScore,
      societyName: societies.name,
      areaName: areas.name,
    })
    .from(households)
    .innerJoin(societies, eq(households.societyId, societies.id))
    .innerJoin(areas, eq(societies.areaId, areas.id))
    .where(eq(households.id, householdId));

  if (!householdRow) return null;

  const [subscriptionRows, dispenserRows, ticketRows, paymentRows, complaintRows] = await Promise.all([
    db
      .select({
        id: subscriptions.id,
        planName: plans.name,
        monthlyPrice: plans.monthlyPrice,
        startDate: subscriptions.startDate,
        endDate: subscriptions.endDate,
        status: subscriptions.status,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(plans.id, subscriptions.planId))
      .where(eq(subscriptions.householdId, householdId))
      .orderBy(desc(subscriptions.startDate))
      .limit(1),
    db
      .select({
        id: dispensers.id,
        type: dispensers.type,
        installDate: dispensers.installDate,
        lastFilterChangeDate: dispensers.lastFilterChangeDate,
        isOnline: dispensers.isOnline,
      })
      .from(dispensers)
      .where(eq(dispensers.householdId, householdId))
      .orderBy(desc(dispensers.installDate))
      .limit(1),
    db
      .select({
        id: serviceTickets.id,
        type: serviceTickets.type,
        status: serviceTickets.status,
        raisedDate: serviceTickets.raisedDate,
        resolvedDate: serviceTickets.resolvedDate,
        slaMet: serviceTickets.slaMet,
        technicianName: technicians.name,
      })
      .from(serviceTickets)
      .leftJoin(technicians, eq(serviceTickets.technicianId, technicians.id))
      .where(eq(serviceTickets.householdId, householdId))
      .orderBy(desc(serviceTickets.raisedDate), desc(serviceTickets.id))
      .limit(50),
    db
      .select({
        id: payments.id,
        billingMonth: payments.billingMonth,
        amount: payments.amount,
        status: payments.status,
        paidDate: payments.paidDate,
      })
      .from(payments)
      .where(eq(payments.householdId, householdId))
      .orderBy(desc(payments.billingMonth))
      .limit(36),
    getHouseholdComplaints(db, householdId),
  ]);

  const dispenser = dispenserRows[0] ?? null;

  const readingRows = dispenser
    ? await db
        .select({
          recordedAt: readings.recordedAt,
          tdsPpm: readings.tdsPpm,
          ph: readings.ph,
          purityPct: readings.purityPct,
        })
        .from(readings)
        .where(and(eq(readings.dispenserId, dispenser.id), gte(readings.recordedAt, thirtyDaysAgo)))
        .orderBy(asc(readings.recordedAt))
    : [];

  return {
    household: householdRow,
    subscription: subscriptionRows[0] ?? null,
    dispenser,
    readings: readingRows.map((reading) => ({
      recordedAt: reading.recordedAt,
      tdsPpm: reading.tdsPpm,
      ph: asNumber(reading.ph) ?? 0,
      purityPct: asNumber(reading.purityPct) ?? 0,
    })),
    tickets: ticketRows,
    complaints: complaintRows,
    payments: paymentRows,
  };
}
