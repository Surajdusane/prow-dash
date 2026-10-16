import { z } from "zod";

import { paginationSchema } from "./common";

export const getOverdueSchema = paginationSchema;

export const markPaidSchema = z.object({
  paymentId: z.coerce.number().int().positive(),
});

export type GetOverdueInput = z.infer<typeof getOverdueSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;
