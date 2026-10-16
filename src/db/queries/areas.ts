import type { Database } from "@/db";
import { asc } from "drizzle-orm";

import { areas } from "@/db/schema";

export type AreaOption = {
  id: number;
  name: string;
};

/** Lightweight area list for the table filters on `/customers` and `/devices`. */
export async function getAreaOptions(db: Database): Promise<AreaOption[]> {
  return db.select({ id: areas.id, name: areas.name }).from(areas).orderBy(asc(areas.name));
}
