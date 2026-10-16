import { TRPCError } from "@trpc/server";

import { getAnomalies, getFleet, getFleetStats, getReadings } from "@/db/queries";
import { getFleetSchema, getReadingsSchema } from "@/trpc/schema";

import { createTRPCRouter } from "../init";
import { authorizedProcedure } from "../procedures/authorizedProcedure";

export const devicesRouter = createTRPCRouter({
  getFleet: authorizedProcedure.input(getFleetSchema).query(({ ctx: { db }, input }) => getFleet(db, input)),
  getReadings: authorizedProcedure.input(getReadingsSchema).query(async ({ ctx: { db }, input }) => {
    const result = await getReadings(db, input);
    if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Dispenser not found." });
    return result;
  }),
  getAnomalies: authorizedProcedure.query(({ ctx: { db } }) => getAnomalies(db)),
  getFleetStats: authorizedProcedure.query(({ ctx: { db } }) => getFleetStats(db)),
});
