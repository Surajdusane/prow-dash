import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const createDatabase = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.");
  }

  const sql = neon(databaseUrl);
  return drizzle({ client: sql, relations: schema.relations });
};

export type Database = ReturnType<typeof createDatabase>;

/**
 * The Drizzle client is created lazily on first use.
 *
 * `next build` evaluates every route module while collecting page data, so reading
 * DATABASE_URL at module scope would make it a build-time requirement. Reading it here
 * keeps builds env-free (`next build` works without DATABASE_URL) while still failing
 * fast with a clear error on the first query at runtime.
 */
let database: Database | undefined;

export const getDb = (): Database => {
  database ??= createDatabase();
  return database;
};

export * from "./schema";
