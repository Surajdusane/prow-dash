import type { Database } from "@/db";
import { eq } from "drizzle-orm";

import { leads } from "@/db/schema";

export type LeadRole = "rwa_secretary" | "resident" | "builder" | "other";

export type LeadMutationRow = {
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

export type CreateLeadParams = {
  name: string;
  societyName?: string;
  role?: LeadRole;
  source: string;
};

export type UpdateLeadParams = {
  id: number;
  visitDate?: string;
  converted?: boolean;
  flatsConverted?: number;
};

const leadSelection = {
  id: leads.id,
  name: leads.name,
  societyName: leads.societyName,
  role: leads.role,
  source: leads.source,
  visitDate: leads.visitDate,
  converted: leads.converted,
  flatsConverted: leads.flatsConverted,
  createdAt: leads.createdAt,
} as const;

export async function createLead(db: Database, params: CreateLeadParams): Promise<LeadMutationRow> {
  const [created] = await db
    .insert(leads)
    .values({
      name: params.name,
      societyName: params.societyName ?? null,
      role: params.role ?? null,
      source: params.source,
      converted: false,
      flatsConverted: 0,
    })
    .returning(leadSelection);

  return created;
}

/** Partial update for the sales funnel; unknown ids return null. */
export async function updateLead(db: Database, params: UpdateLeadParams): Promise<LeadMutationRow | null> {
  const patch: Partial<Pick<typeof leads.$inferInsert, "visitDate" | "converted" | "flatsConverted">> = {};

  if (params.visitDate !== undefined) patch.visitDate = params.visitDate;
  if (params.converted !== undefined) patch.converted = params.converted;
  if (params.flatsConverted !== undefined) patch.flatsConverted = params.flatsConverted;

  if (Object.keys(patch).length === 0) {
    const [existing] = await db.select(leadSelection).from(leads).where(eq(leads.id, params.id));
    return existing ?? null;
  }

  const [updated] = await db.update(leads).set(patch).where(eq(leads.id, params.id)).returning(leadSelection);

  return updated ?? null;
}
