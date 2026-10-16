import { createTRPCRouter } from "../init";
import { customersRouter } from "./customers";
import { devicesRouter } from "./devices";
import { impactRouter } from "./impact";
import { leadsRouter } from "./leads";
import { overviewRouter } from "./overview";
import { revenueRouter } from "./revenue";
import { serviceOpsRouter } from "./service-ops";
import { societiesRouter } from "./societies";

export const appRouter = createTRPCRouter({
  overview: overviewRouter,
  serviceOps: serviceOpsRouter,
  customers: customersRouter,
  devices: devicesRouter,
  revenue: revenueRouter,
  societies: societiesRouter,
  leads: leadsRouter,
  impact: impactRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
