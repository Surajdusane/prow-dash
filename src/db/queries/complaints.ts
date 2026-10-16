import type { Database } from "@/db";
import { desc, eq } from "drizzle-orm";

import { complaints } from "@/db/schema";

import { toDateKey } from "./utils";

export type ComplaintCategory = "water_quality" | "service_delay" | "billing" | "device_malfunction" | "other";
export type ComplaintSeverity = "low" | "medium" | "high";

export type ComplaintRow = {
  id: number;
  householdId: number;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  date: string;
  resolved: boolean;
  resolutionDate: string | null;
};

export type CreateComplaintParams = {
  householdId: number;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  /** `YYYY-MM-DD`; defaults to today when omitted. */
  date?: string;
};

export async function getHouseholdComplaints(db: Database, householdId: number): Promise<ComplaintRow[]> {
  return db
    .select({
      id: complaints.id,
      householdId: complaints.householdId,
      category: complaints.category,
      severity: complaints.severity,
      date: complaints.date,
      resolved: complaints.resolved,
      resolutionDate: complaints.resolutionDate,
    })
    .from(complaints)
    .where(eq(complaints.householdId, householdId))
    .orderBy(desc(complaints.date), desc(complaints.id))
    .limit(50);
}

export async function createComplaint(db: Database, params: CreateComplaintParams): Promise<ComplaintRow> {
  const [created] = await db
    .insert(complaints)
    .values({
      householdId: params.householdId,
      category: params.category,
      severity: params.severity,
      date: params.date ?? toDateKey(new Date()),
      resolved: false,
    })
    .returning({
      id: complaints.id,
      householdId: complaints.householdId,
      category: complaints.category,
      severity: complaints.severity,
      date: complaints.date,
      resolved: complaints.resolved,
      resolutionDate: complaints.resolutionDate,
    });

  return created;
}

/** Resolves a complaint (idempotent). Returns null when the complaint does not exist. */
export async function resolveComplaint(db: Database, id: number): Promise<ComplaintRow | null> {
  const [updated] = await db
    .update(complaints)
    .set({ resolved: true, resolutionDate: toDateKey(new Date()) })
    .where(eq(complaints.id, id))
    .returning({
      id: complaints.id,
      householdId: complaints.householdId,
      category: complaints.category,
      severity: complaints.severity,
      date: complaints.date,
      resolved: complaints.resolved,
      resolutionDate: complaints.resolutionDate,
    });

  return updated ?? null;
}
