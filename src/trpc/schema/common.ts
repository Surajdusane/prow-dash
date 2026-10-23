import { z } from "zod";

/** Shared pagination contract - server-paged tables default to 25 rows. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const sortDirSchema = z.enum(["asc", "desc"]).default("desc");

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SortDir = z.infer<typeof sortDirSchema>;
