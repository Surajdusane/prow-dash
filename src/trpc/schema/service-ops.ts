import { z } from "zod";

export const ticketTypeSchema = z.enum(["filter_change", "repair", "installation", "inspection"]);
export const ticketStatusSchema = z.enum(["open", "in_progress", "resolved"]);

export const getBoardSchema = z.object({
  areaId: z.coerce.number().int().positive().optional(),
  type: ticketTypeSchema.optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createTicketSchema = z.object({
  householdId: z.coerce.number().int().positive(),
  type: ticketTypeSchema,
});

export const updateTicketStatusSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: ticketStatusSchema,
});

export const assignTicketSchema = z.object({
  id: z.coerce.number().int().positive(),
  technicianId: z.coerce.number().int().positive().nullable(),
});

export const removeTicketSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type GetBoardInput = z.infer<typeof getBoardSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type RemoveTicketInput = z.infer<typeof removeTicketSchema>;
