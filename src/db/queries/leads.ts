import type { Database } from "@/db";
import { and, count, desc, eq, sql } from "drizzle-orm";

import { leads } from "@/db/schema";

import type { LeadRole } from "./leads-mutations";
import { startOfDay, toPercent } from "./utils";

export type LeadsKpis = {
  totalLeads: number;
  visitRate: number;
  conversionRate: number;
  /** Flats converted on leads created in the current quarter. */
  flatsConvertedQtd: number;
};

export type FunnelStage = {
  stage: "leads" | "visits" | "converted";
  count: number;
  pctOfLeads: number;
};

export type LeadBySourceRow = {
  source: string;
  leads: number;
  visits: number;
  converted: number;
  /** Converted ÷ leads, 0–100. */
  conversionRate: number;
};

export type GetLeadListParams = {
  page: number;
  limit: number;
  source?: string;
  converted?: boolean;
};

export type LeadListRow = {
  id: number;
  name: string;
  societyName: string | null;
  role: LeadRole | null;
  source: string | null;
  visitDate: string | null;
  converted: boolean;
  flatsConverted: number | null;
  createdAt: Date;
};

export type LeadListResult = {
  rows: LeadListRow[];
  total: number;
};

function startOfQuarter(now: Date): Date {
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  return startOfDay(new Date(now.getFullYear(), quarterStartMonth, 1));
}

export async function getLeadsKpis(db: Database): Promise<LeadsKpis> {
  const quarterStart = startOfQuarter(new Date());

  const [row] = await db
    .select({
      total: count(),
      visits: sql<number>`count(*) filter (where ${leads.visitDate} is not null)`.mapWith(Number),
      converted: sql<number>`count(*) filter (where ${leads.converted} = true)`.mapWith(Number),
      flatsQtd:
        sql<number>`coalesce(sum(${leads.flatsConverted}) filter (where ${leads.createdAt} >= ${quarterStart}), 0)`.mapWith(
          Number
        ),
    })
    .from(leads);

  const total = row?.total ?? 0;

  return {
    totalLeads: total,
    visitRate: toPercent(row?.visits ?? 0, total),
    conversionRate: toPercent(row?.converted ?? 0, total),
    flatsConvertedQtd: row?.flatsQtd ?? 0,
  };
}

export async function getLeadFunnel(db: Database): Promise<FunnelStage[]> {
  const [row] = await db
    .select({
      total: count(),
      visits: sql<number>`count(*) filter (where ${leads.visitDate} is not null)`.mapWith(Number),
      converted: sql<number>`count(*) filter (where ${leads.converted} = true)`.mapWith(Number),
    })
    .from(leads);

  const total = row?.total ?? 0;

  return [
    { stage: "leads", count: total, pctOfLeads: total > 0 ? 100 : 0 },
    { stage: "visits", count: row?.visits ?? 0, pctOfLeads: toPercent(row?.visits ?? 0, total) },
    { stage: "converted", count: row?.converted ?? 0, pctOfLeads: toPercent(row?.converted ?? 0, total) },
  ];
}

export async function getLeadsBySource(db: Database): Promise<LeadBySourceRow[]> {
  const rows = await db
    .select({
      source: leads.source,
      total: count(),
      visits: sql<number>`count(*) filter (where ${leads.visitDate} is not null)`.mapWith(Number),
      converted: sql<number>`count(*) filter (where ${leads.converted} = true)`.mapWith(Number),
    })
    .from(leads)
    .groupBy(leads.source)
    .orderBy(desc(count()));

  return rows.map((row) => ({
    source: row.source ?? "unknown",
    leads: row.total,
    visits: row.visits,
    converted: row.converted,
    conversionRate: toPercent(row.converted, row.total),
  }));
}

export async function getLeadList(db: Database, params: GetLeadListParams): Promise<LeadListResult> {
  const conditions = [
    params.source ? eq(leads.source, params.source) : undefined,
    params.converted !== undefined ? eq(leads.converted, params.converted) : undefined,
  ];

  const [rows, [totals]] = await Promise.all([
    db
      .select({
        id: leads.id,
        name: leads.name,
        societyName: leads.societyName,
        role: leads.role,
        source: leads.source,
        visitDate: leads.visitDate,
        converted: leads.converted,
        flatsConverted: leads.flatsConverted,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(and(...conditions))
      .orderBy(desc(leads.createdAt), desc(leads.id))
      .limit(params.limit)
      .offset((params.page - 1) * params.limit),
    db
      .select({ total: count() })
      .from(leads)
      .where(and(...conditions)),
  ]);

  return { rows, total: totals?.total ?? 0 };
}
