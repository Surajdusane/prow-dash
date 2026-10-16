import { getImpactByPlan, getImpactMonthlyTrend, getImpactTotals } from "@/db/queries";

import { createTRPCRouter } from "../init";
import { authorizedProcedure } from "../procedures/authorizedProcedure";

export const impactRouter = createTRPCRouter({
  getTotals: authorizedProcedure.query(({ ctx: { db } }) => getImpactTotals(db)),
  getMonthlyTrend: authorizedProcedure.query(({ ctx: { db } }) => getImpactMonthlyTrend(db)),
  getByPlan: authorizedProcedure.query(({ ctx: { db } }) => getImpactByPlan(db)),
});
