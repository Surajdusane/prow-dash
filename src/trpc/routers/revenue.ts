import { TRPCError } from "@trpc/server";

import {
  getCohortRetention,
  getMrrTrend,
  getOverduePayments,
  getPaymentStatusByMonth,
  getPlanMixTrend,
  getRevenueKpis,
  markPaymentPaid,
} from "@/db/queries";
import { getOverdueSchema, markPaidSchema } from "@/trpc/schema";

import { createTRPCRouter } from "../init";
import { authorizedProcedure } from "../procedures/authorizedProcedure";

export const revenueRouter = createTRPCRouter({
  getKpis: authorizedProcedure.query(({ ctx: { db } }) => getRevenueKpis(db)),
  getMrrTrend: authorizedProcedure.query(({ ctx: { db } }) => getMrrTrend(db)),
  getPlanMixTrend: authorizedProcedure.query(({ ctx: { db } }) => getPlanMixTrend(db)),
  getPaymentStatusByMonth: authorizedProcedure.query(({ ctx: { db } }) => getPaymentStatusByMonth(db)),
  getCohortRetention: authorizedProcedure.query(({ ctx: { db } }) => getCohortRetention(db)),
  getOverdue: authorizedProcedure
    .input(getOverdueSchema)
    .query(({ ctx: { db }, input }) => getOverduePayments(db, input)),

  markPaid: authorizedProcedure.input(markPaidSchema).mutation(async ({ ctx: { db }, input }) => {
    const payment = await markPaymentPaid(db, input.paymentId);
    if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found." });
    return payment;
  }),
});
