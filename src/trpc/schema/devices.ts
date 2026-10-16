import { z } from "zod";

import { paginationSchema } from "./common";

export const dispenserTypeSchema = z.enum(["own_device", "standard", "premium"]);

export const getFleetSchema = paginationSchema.extend({
  areaId: z.coerce.number().int().positive().optional(),
  type: dispenserTypeSchema.optional(),
  online: z.boolean().optional(),
});

export const getReadingsSchema = z.object({
  dispenserId: z.coerce.number().int().positive(),
  days: z.union([z.literal(30), z.literal(90)]).default(30),
});

export type GetFleetInput = z.infer<typeof getFleetSchema>;
export type GetReadingsInput = z.infer<typeof getReadingsSchema>;
