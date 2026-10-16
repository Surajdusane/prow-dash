import { getAreaHealth, getHouseholdGrowth, getOverviewKpis, getPlanMix, getRevenueTrend } from "@/db/queries";

import { createTRPCRouter } from "../init";
import { authorizedProcedure } from "../procedures/authorizedProcedure";

export const overviewRouter = createTRPCRouter({
  getKpis: authorizedProcedure.query(({ ctx: { db } }) => getOverviewKpis(db)),
  getRevenueTrend: authorizedProcedure.query(({ ctx: { db } }) => getRevenueTrend(db)),
  getHouseholdGrowth: authorizedProcedure.query(({ ctx: { db } }) => getHouseholdGrowth(db)),
  getPlanMix: authorizedProcedure.query(({ ctx: { db } }) => getPlanMix(db)),
  getAreaHealth: authorizedProcedure.query(({ ctx: { db } }) => getAreaHealth(db)),
});
