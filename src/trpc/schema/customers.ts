import { z } from "zod";

import { paginationSchema, sortDirSchema } from "./common";

export const riskBandSchema = z.enum(["low", "medium", "high"]);
export const householdStatusSchema = z.enum(["active", "cancelled"]);
export const complaintCategorySchema = z.enum([
  "water_quality",
  "service_delay",
  "billing",
  "device_malfunction",
  "other",
]);
export const complaintSeveritySchema = z.enum(["low", "medium", "high"]);

export const getRiskTableSchema = paginationSchema.extend({
  sort: z.enum(["risk", "tenure", "complaints", "latePayments", "joinDate"]).default("risk"),
  dir: sortDirSchema,
  riskBand: riskBandSchema.optional(),
  areaId: z.coerce.number().int().positive().optional(),
  status: householdStatusSchema.optional(),
});

export const getHouseholdProfileSchema = z.object({
  householdId: z.coerce.number().int().positive(),
});

export const recomputeRiskSchema = z.object({
  householdId: z.coerce.number().int().positive().optional(),
});

export const createComplaintSchema = z.object({
  householdId: z.coerce.number().int().positive(),
  category: complaintCategorySchema,
  severity: complaintSeveritySchema,
  /** `YYYY-MM-DD`; defaults to today server-side. */
  date: z.iso.date().optional(),
});

export const resolveComplaintSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type GetRiskTableInput = z.infer<typeof getRiskTableSchema>;
export type GetHouseholdProfileInput = z.infer<typeof getHouseholdProfileSchema>;
export type RecomputeRiskInput = z.infer<typeof recomputeRiskSchema>;
export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type ResolveComplaintInput = z.infer<typeof resolveComplaintSchema>;
