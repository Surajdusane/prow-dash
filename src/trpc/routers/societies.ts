import { TRPCError } from "@trpc/server";

import { getAreaPenetration, getGrowthTrend, getSocietiesKpis, getSocietyDetail, getSocietyList } from "@/db/queries";
import { getSocietyByIdSchema, getSocietyListSchema } from "@/trpc/schema";

import { createTRPCRouter } from "../init";
import { authorizedProcedure } from "../procedures/authorizedProcedure";

export const societiesRouter = createTRPCRouter({
  getKpis: authorizedProcedure.query(({ ctx: { db } }) => getSocietiesKpis(db)),
  getList: authorizedProcedure.input(getSocietyListSchema).query(({ ctx: { db }, input }) => getSocietyList(db, input)),
  getGrowthTrend: authorizedProcedure.query(({ ctx: { db } }) => getGrowthTrend(db)),
  getAreaPenetration: authorizedProcedure.query(({ ctx: { db } }) => getAreaPenetration(db)),
  getById: authorizedProcedure.input(getSocietyByIdSchema).query(async ({ ctx: { db }, input }) => {
    const society = await getSocietyDetail(db, input.societyId);
    if (!society) throw new TRPCError({ code: "NOT_FOUND", message: "Society not found." });
    return society;
  }),
});
