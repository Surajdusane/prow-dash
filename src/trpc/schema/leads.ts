import { z } from "zod";

import { paginationSchema } from "./common";

export const leadRoleSchema = z.enum(["rwa_secretary", "resident", "builder", "other"]);

export const getLeadListSchema = paginationSchema.extend({
  source: z.string().trim().min(1).max(60).optional(),
  converted: z.boolean().optional(),
});

export const createLeadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  societyName: z.string().trim().min(1).max(150).optional(),
  role: leadRoleSchema.optional(),
  source: z.string().trim().min(1).max(60),
});

export const updateLeadSchema = z.object({
  id: z.coerce.number().int().positive(),
  /** `null` clears a previously set visit date — the UI's "clear" affordance. */
  visitDate: z.iso.date().nullable().optional(),
  converted: z.boolean().optional(),
  flatsConverted: z.number().int().min(0).max(100).optional(),
});

export type GetLeadListInput = z.infer<typeof getLeadListSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
