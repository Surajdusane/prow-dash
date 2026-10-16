import { TRPCError } from "@trpc/server";

import { getAnomalies, getAreaOptions, getFleet, getFleetStats, getReadings, getReadingsTrend } from "@/db/queries";
import { getFleetSchema, getReadingsSchema, getReadingsTrendSchema } from "@/trpc/schema";

import { createTRPCRouter } from "../init";
import { authorizedProcedure } from "../procedures/authorizedProcedure";

export const devicesRouter = createTRPCRouter({
  getAreas: authorizedProcedure.query(({ ctx: { db } }) => getAreaOptions(db)),
  getFleet: authorizedProcedure.input(getFleetSchema).query(({ ctx: { db }, input }) => getFleet(db, input)),
  getReadings: authorizedProcedure.input(getReadingsSchema).query(async ({ ctx: { db }, input }) => {
    const result = await getReadings(db, input);
    if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Dispenser not found." });
    return result;
  }),
  getReadingsTrend: authorizedProcedure
    .input(getReadingsTrendSchema)
    .query(({ ctx: { db }, input }) => getReadingsTrend(db, input)),
  getAnomalies: authorizedProcedure.query(({ ctx: { db } }) => getAnomalies(db)),
  getFleetStats: authorizedProcedure.query(({ ctx: { db } }) => getFleetStats(db)),
});
