import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.");
}

const sql = neon(databaseUrl);
export const db = drizzle({ client: sql, relations: schema.relations });

export * from "./schema";
export type Database = typeof db;
