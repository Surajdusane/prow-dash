import { z } from "zod";

import { paginationSchema, sortDirSchema } from "./common";

export const getSocietyListSchema = paginationSchema.extend({
  areaId: z.coerce.number().int().positive().optional(),
  sort: z.enum(["penetration", "subscribed", "totalFlats", "openTickets", "avgTds30d", "name"]).default("penetration"),
  dir: sortDirSchema,
  search: z.string().trim().min(1).max(150).optional(),
});

export const getSocietyByIdSchema = z.object({
  societyId: z.coerce.number().int().positive(),
});

export type GetSocietyListInput = z.infer<typeof getSocietyListSchema>;
export type GetSocietyByIdInput = z.infer<typeof getSocietyByIdSchema>;
