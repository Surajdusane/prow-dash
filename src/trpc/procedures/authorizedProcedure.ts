import { baseProcedure } from "@/trpc/init";

// Becase of not using any auth for this project so i am using this procedure for all the api
export const authorizedProcedure = baseProcedure