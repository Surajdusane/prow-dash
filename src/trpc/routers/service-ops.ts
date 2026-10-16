import { TRPCError } from "@trpc/server";

import {
  assignTicket,
  createTicket,
  getAreaDemand,
  getBoard,
  getHouseholdsLite,
  getPredictive,
  getSlaStats,
  getTechnicianWorkload,
  removeTicket,
  updateTicketStatus,
} from "@/db/queries";
import {
  assignTicketSchema,
  createTicketSchema,
  getBoardSchema,
  removeTicketSchema,
  updateTicketStatusSchema,
} from "@/trpc/schema";

import { createTRPCRouter } from "../init";
import { authorizedProcedure } from "../procedures/authorizedProcedure";

export const serviceOpsRouter = createTRPCRouter({
  getBoard: authorizedProcedure.input(getBoardSchema).query(({ ctx: { db }, input }) => getBoard(db, input)),
  getAreaDemand: authorizedProcedure.query(({ ctx: { db } }) => getAreaDemand(db)),
  getPredictive: authorizedProcedure.query(({ ctx: { db } }) => getPredictive(db)),
  getSlaStats: authorizedProcedure.query(({ ctx: { db } }) => getSlaStats(db)),
  getTechnicianWorkload: authorizedProcedure.query(({ ctx: { db } }) => getTechnicianWorkload(db)),
  getHouseholdsLite: authorizedProcedure.query(({ ctx: { db } }) => getHouseholdsLite(db)),

  createTicket: authorizedProcedure.input(createTicketSchema).mutation(async ({ ctx: { db }, input }) => {
    const ticket = await createTicket(db, input);
    if (!ticket) {
      throw new TRPCError({ code: "NOT_FOUND", message: "This household has no dispenser to raise a ticket against." });
    }
    return ticket;
  }),

  updateStatus: authorizedProcedure.input(updateTicketStatusSchema).mutation(async ({ ctx: { db }, input }) => {
    const ticket = await updateTicketStatus(db, input);
    if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found." });
    return ticket;
  }),

  assign: authorizedProcedure.input(assignTicketSchema).mutation(async ({ ctx: { db }, input }) => {
    const ticket = await assignTicket(db, input);
    if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found." });
    return ticket;
  }),

  remove: authorizedProcedure.input(removeTicketSchema).mutation(async ({ ctx: { db }, input }) => {
    const deleted = await removeTicket(db, input.id);
    if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found." });
    return deleted;
  }),
});
