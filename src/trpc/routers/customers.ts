import { TRPCError } from "@trpc/server";

import {
  createComplaint,
  getComplaintTrend,
  getHouseholdProfile,
  getRiskDistribution,
  getRiskTable,
  recomputeAllRiskScores,
  resolveComplaint,
} from "@/db/queries";
import {
  createComplaintSchema,
  getHouseholdProfileSchema,
  getRiskTableSchema,
  recomputeRiskSchema,
  resolveComplaintSchema,
} from "@/trpc/schema";

import { createTRPCRouter } from "../init";
import { authorizedProcedure } from "../procedures/authorizedProcedure";

export const customersRouter = createTRPCRouter({
  getRiskTable: authorizedProcedure
    .input(getRiskTableSchema)
    .query(({ ctx: { db }, input }) => getRiskTable(db, input)),
  getRiskDistribution: authorizedProcedure.query(({ ctx: { db } }) => getRiskDistribution(db)),
  getComplaintTrend: authorizedProcedure.query(({ ctx: { db } }) => getComplaintTrend(db)),
  getById: authorizedProcedure
    .input(getHouseholdProfileSchema)
    .query(({ ctx: { db }, input }) => getHouseholdProfile(db, input.householdId)),

  recomputeRisk: authorizedProcedure
    .input(recomputeRiskSchema)
    .mutation(({ ctx: { db }, input }) => recomputeAllRiskScores(db, { householdId: input.householdId })),

  createComplaint: authorizedProcedure
    .input(createComplaintSchema)
    .mutation(({ ctx: { db }, input }) => createComplaint(db, input)),

  resolveComplaint: authorizedProcedure.input(resolveComplaintSchema).mutation(async ({ ctx: { db }, input }) => {
    const complaint = await resolveComplaint(db, input.id);
    if (!complaint) throw new TRPCError({ code: "NOT_FOUND", message: "Complaint not found." });
    return complaint;
  }),
});
