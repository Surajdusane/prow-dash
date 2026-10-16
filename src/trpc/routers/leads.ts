import { TRPCError } from "@trpc/server";

import { createLead, getLeadFunnel, getLeadList, getLeadsBySource, getLeadsKpis, updateLead } from "@/db/queries";
import { createLeadSchema, getLeadListSchema, updateLeadSchema } from "@/trpc/schema";

import { createTRPCRouter } from "../init";
import { authorizedProcedure } from "../procedures/authorizedProcedure";

export const leadsRouter = createTRPCRouter({
  getKpis: authorizedProcedure.query(({ ctx: { db } }) => getLeadsKpis(db)),
  getFunnel: authorizedProcedure.query(({ ctx: { db } }) => getLeadFunnel(db)),
  getBySource: authorizedProcedure.query(({ ctx: { db } }) => getLeadsBySource(db)),
  getList: authorizedProcedure.input(getLeadListSchema).query(({ ctx: { db }, input }) => getLeadList(db, input)),

  create: authorizedProcedure.input(createLeadSchema).mutation(({ ctx: { db }, input }) => createLead(db, input)),

  update: authorizedProcedure.input(updateLeadSchema).mutation(async ({ ctx: { db }, input }) => {
    const lead = await updateLead(db, input);
    if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found." });
    return lead;
  }),
});
