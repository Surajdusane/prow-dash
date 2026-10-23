import "dotenv/config";

import { getDb } from "@/db";
import { en, Faker } from "@faker-js/faker";
import { count, sql } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import type { AnyPgTable } from "drizzle-orm/pg-core";

import { recomputeAllRiskScores } from "@/db/queries/risk";
import {
  areas,
  complaints,
  dispensers,
  households,
  leads,
  payments,
  plans,
  readings,
  serviceTickets,
  societies,
  subscriptions,
  technicians,
} from "@/db/schema";
import { generateComplaints } from "@/db/seed/generators/complaints";
import { generateDispensers } from "@/db/seed/generators/dispensers";
import { generateHouseholds, householdsToSubscriptions } from "@/db/seed/generators/households";
import { generateLeads } from "@/db/seed/generators/leads";
import { generatePayments } from "@/db/seed/generators/payments";
import { buildReadings, simulateDispenserLife } from "@/db/seed/generators/readings";
import { generateSocieties } from "@/db/seed/generators/societies";
import { buildDispenserTickets, type TechnicianRef, type TicketSeed } from "@/db/seed/generators/tickets";
import { addMonths, historyWindowStart, startOfDay, toDateKey } from "@/db/seed/patterns";
import { AREA_SEEDS, PLAN_SEEDS, TECHNICIAN_SEEDS } from "@/db/seed/reference";

const db = getDb();

/* ---------------------------------------------------------
   Constants
   --------------------------------------------------------- */

const FAKER_SEED = 42;
const CHUNK_SIZE = 1_000; // Neon HTTP param limits - keep batches at/under 1k rows
const SOCIETY_COUNT = 50;
const LEAD_COUNT = 450;

const ALL_TABLES: { name: string; table: AnyPgTable }[] = [
  { name: "areas", table: areas },
  { name: "plans", table: plans },
  { name: "technicians", table: technicians },
  { name: "societies", table: societies },
  { name: "households", table: households },
  { name: "subscriptions", table: subscriptions },
  { name: "dispensers", table: dispensers },
  { name: "readings", table: readings },
  { name: "service_tickets", table: serviceTickets },
  { name: "complaints", table: complaints },
  { name: "payments", table: payments },
  { name: "leads", table: leads },
];

/* ---------------------------------------------------------
   Utilities
   --------------------------------------------------------- */

function log(message: string): void {
  const stamp = new Date().toISOString().slice(11, 19);
  console.log(`[${stamp}] ${message}`);
}

async function truncateAll(): Promise<void> {
  const names = ALL_TABLES.map((entry) => entry.name).join(", ");
  await db.execute(sql.raw(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`));
}

async function getTableCounts(): Promise<{ name: string; rows: number }[]> {
  const counts: { name: string; rows: number }[] = [];
  for (const { name, table } of ALL_TABLES) {
    const [row] = await db.select({ value: count() }).from(table);
    counts.push({ name, rows: Number(row?.value ?? 0) });
  }
  return counts;
}

/** Chunked insert for tables where we don't need generated ids back. */
async function insertInChunks<T extends AnyPgTable>(
  table: T,
  rows: InferInsertModel<T>[],
  label: string
): Promise<number> {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await db.insert(table).values(chunk as never);
    const done = i + chunk.length;
    if (done % (CHUNK_SIZE * 5) === 0 || done === rows.length) {
      log(`  ${label}: ${done}/${rows.length} inserted`);
    }
  }
  return rows.length;
}

/* ---------------------------------------------------------
   Main
   --------------------------------------------------------- */

async function main(): Promise<void> {
  const fresh = process.argv.includes("--fresh");
  const now = new Date();
  const today = startOfDay(now);
  const windowStart = historyWindowStart(today);

  const faker = new Faker({ locale: en });
  faker.seed(FAKER_SEED);

  log(`ProWater seed - 24-month window ${toDateKey(windowStart)} → ${toDateKey(today)} (faker seed ${FAKER_SEED})`);

  if (fresh) {
    log("Truncating all 12 tables (RESTART IDENTITY CASCADE)…");
    await truncateAll();
  } else {
    const existing = await getTableCounts();
    const populated = existing.filter((entry) => entry.rows > 0);
    if (populated.length > 0) {
      log(`Database is not empty: ${populated.map((entry) => `${entry.name}=${entry.rows}`).join(", ")}`);
      log("Run `bun run db:reset` (seeds with --fresh) to truncate and reseed.");
      process.exitCode = 1;
      return;
    }
    log("Database is empty - proceeding (re-run with --fresh to skip this check).");
  }

  /* ---------- Stage 1: reference data ---------- */

  const areaRows = await db
    .insert(areas)
    .values(
      AREA_SEEDS.map((area) => ({
        name: area.name,
        latitude: area.latitude,
        longitude: area.longitude,
        infrastructureAgeYears: area.infrastructureAgeYears,
      }))
    )
    .returning({ id: areas.id, name: areas.name });
  const areaIdByName = new Map(areaRows.map((area) => [area.name, area.id]));
  log(`areas: ${areaRows.length}`);

  const planRows = await db
    .insert(plans)
    .values(
      PLAN_SEEDS.map((plan) => ({
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        deposit: plan.deposit,
        includesDispenser: plan.includesDispenser,
      }))
    )
    .returning({ id: plans.id, name: plans.name });
  const planIdByName = new Map(planRows.map((plan) => [plan.name, plan.id]));
  const planPriceByName = new Map(PLAN_SEEDS.map((plan) => [plan.name, plan.monthlyPrice]));
  log(`plans: ${planRows.length}`);

  const technicianValues = TECHNICIAN_SEEDS.map((tech) => ({
    name: tech.name,
    areaId: areaIdByName.get(tech.areaName)!,
    joinDate: toDateKey(addMonths(today, -tech.joinMonthsAgo)),
    active: tech.active,
  }));
  const technicianRows = await db.insert(technicians).values(technicianValues).returning({ id: technicians.id });
  const technicianRefs: TechnicianRef[] = TECHNICIAN_SEEDS.map((seed, index) => ({
    id: technicianRows[index].id,
    areaName: seed.areaName,
    joinDate: new Date(technicianValues[index].joinDate),
    active: seed.active,
    loadWeight: seed.loadWeight,
  }));
  log(`technicians: ${technicianRows.length} (across ${new Set(TECHNICIAN_SEEDS.map((t) => t.areaName)).size} areas)`);

  /* ---------- Stage 2: societies ---------- */

  const societySeeds = generateSocieties(faker, { today, count: SOCIETY_COUNT, windowStart });
  const societyRows = await db
    .insert(societies)
    .values(
      societySeeds.map((society) => ({
        areaId: areaIdByName.get(society.areaName)!,
        name: society.name,
        totalFlats: society.totalFlats,
        onboardedDate: society.onboardedDate,
        latitude: society.latitude,
        longitude: society.longitude,
      }))
    )
    .returning({ id: societies.id, name: societies.name });
  const societyIdByName = new Map(societyRows.map((society) => [society.name, society.id]));
  const societyCtx = societySeeds.map((seed) => ({ id: societyIdByName.get(seed.name)!, seed }));
  log(`societies: ${societyRows.length}`);

  /* ---------- Stage 3: households ---------- */

  const householdSeeds = generateHouseholds(faker, {
    today,
    windowStart,
    societies: societyCtx,
    plans: PLAN_SEEDS.map((plan) => ({ name: plan.name, id: planIdByName.get(plan.name)! })),
  });

  const insertedHouseholds: { id: number; societyId: number; flatNumber: string }[] = [];
  for (let i = 0; i < householdSeeds.length; i += CHUNK_SIZE) {
    const chunk = householdSeeds.slice(i, i + CHUNK_SIZE);
    const inserted = await db
      .insert(households)
      .values(
        chunk.map((household) => ({
          societyId: household.societyId,
          flatNumber: household.flatNumber,
          residentName: household.residentName,
          phone: household.phone,
          joinDate: household.joinDate,
          status: household.status,
          cancelDate: household.cancelDate,
        }))
      )
      .returning({ id: households.id, societyId: households.societyId, flatNumber: households.flatNumber });
    insertedHouseholds.push(...inserted);
  }
  const householdIdByKey = new Map(insertedHouseholds.map((row) => [`${row.societyId}:${row.flatNumber}`, row.id]));
  const householdWithId = householdSeeds.map((household) => ({
    ...household,
    id: householdIdByKey.get(`${household.societyId}:${household.flatNumber}`)!,
  }));
  const activeCount = householdWithId.filter((household) => household.status === "active").length;
  const cohortCount = householdWithId.filter((household) => household.riskCohort).length;
  log(
    `households: ${householdWithId.length} (${activeCount} active / ${householdWithId.length - activeCount} cancelled, ${cohortCount} risk-cohort)`
  );

  /* ---------- Stage 4: subscriptions ---------- */

  const subscriptionSeeds = householdsToSubscriptions(householdWithId);
  const insertedSubscriptions: { id: number; householdId: number }[] = [];
  for (let i = 0; i < subscriptionSeeds.length; i += CHUNK_SIZE) {
    const inserted = await db
      .insert(subscriptions)
      .values(subscriptionSeeds.slice(i, i + CHUNK_SIZE))
      .returning({ id: subscriptions.id, householdId: subscriptions.householdId });
    insertedSubscriptions.push(...inserted);
  }
  const subscriptionIdByHousehold = new Map(insertedSubscriptions.map((row) => [row.householdId, row.id]));
  log(`subscriptions: ${insertedSubscriptions.length}`);

  /* ---------- Stage 5: dispensers (timeline simulated first for lastFilterChangeDate) ---------- */

  const dispenserSeeds = generateDispensers(faker, householdWithId, { today });
  const infraByAreaName = new Map(AREA_SEEDS.map((area) => [area.name, area.infrastructureAgeYears]));
  const lives = dispenserSeeds.map((dispenser) =>
    simulateDispenserLife(faker, {
      installDate: dispenser.installDate,
      activeEnd: dispenser.activeEnd,
      infrastructureAgeYears: infraByAreaName.get(dispenser.areaName)!,
      planName: dispenser.planName,
    })
  );

  const insertedDispensers: { id: number; householdId: number }[] = [];
  for (let i = 0; i < dispenserSeeds.length; i += CHUNK_SIZE) {
    const values: (typeof dispensers.$inferInsert)[] = [];
    for (let j = i; j < Math.min(i + CHUNK_SIZE, dispenserSeeds.length); j += 1) {
      const dispenser = dispenserSeeds[j];
      const lastChange = lives[j].filterChangeDates.at(-1) ?? dispenser.installDate;
      values.push({
        householdId: dispenser.householdId,
        type: dispenser.type,
        installDate: toDateKey(dispenser.installDate),
        lastFilterChangeDate: toDateKey(lastChange),
        isOnline: dispenser.isOnline,
      });
    }
    const inserted = await db
      .insert(dispensers)
      .values(values)
      .returning({ id: dispensers.id, householdId: dispensers.householdId });
    insertedDispensers.push(...inserted);
  }
  const dispenserIdByHousehold = new Map(insertedDispensers.map((row) => [row.householdId, row.id]));
  const offlineCount = dispenserSeeds.filter((dispenser) => !dispenser.isOnline).length;
  log(`dispensers: ${insertedDispensers.length} (${offlineCount} offline)`);

  /* ---------- Stage 6: readings + tickets (the causal core) ---------- */

  const ticketSeeds: TicketSeed[] = [];
  let readingBuffer: (typeof readings.$inferInsert)[] = [];
  let readingsInserted = 0;

  for (let i = 0; i < dispenserSeeds.length; i += 1) {
    const dispenser = dispenserSeeds[i];
    const dispenserId = dispenserIdByHousehold.get(dispenser.householdId)!;
    const life = lives[i];

    const dispenserReadings = buildReadings(faker, { readingEnd: dispenser.readingEnd, now }, life);
    for (const reading of dispenserReadings) {
      readingBuffer.push({ ...reading, dispenserId });
    }
    if (readingBuffer.length >= CHUNK_SIZE) {
      const batch = readingBuffer;
      readingBuffer = [];
      await db.insert(readings).values(batch);
      readingsInserted += batch.length;
    }

    ticketSeeds.push(
      ...buildDispenserTickets(
        faker,
        {
          today,
          now,
          technicians: technicianRefs,
          areaName: dispenser.areaName,
          householdId: dispenser.householdId,
          dispenserId,
          installDate: dispenser.installDate,
        },
        life
      )
    );

    if ((i + 1) % 250 === 0) {
      log(
        `  timeline: ${i + 1}/${dispenserSeeds.length} dispensers, ${readingsInserted + readingBuffer.length} readings so far`
      );
    }
  }
  if (readingBuffer.length > 0) {
    await db.insert(readings).values(readingBuffer);
    readingsInserted += readingBuffer.length;
  }
  log(`readings: ${readingsInserted}`);
  log(`service_tickets: ${ticketSeeds.length}`);
  await insertInChunks(serviceTickets, ticketSeeds, "service_tickets");

  /* ---------- Stage 7: complaints ---------- */

  const complaintSeeds = generateComplaints(faker, {
    today,
    households: householdWithId.map((household) => ({
      id: household.id,
      joinDate: new Date(household.joinDate),
      cancelDate: household.cancelDate ? new Date(household.cancelDate) : null,
      riskCohort: household.riskCohort,
      cohortWindow: household.cohortWindow,
    })),
  });
  log(`complaints: ${complaintSeeds.length}`);
  await insertInChunks(complaints, complaintSeeds, "complaints");

  /* ---------- Stage 8: payments ---------- */

  const paymentSeeds = generatePayments(faker, {
    today,
    subscriptions: householdWithId.map((household) => ({
      subscriptionId: subscriptionIdByHousehold.get(household.id)!,
      householdId: household.id,
      amount: planPriceByName.get(household.planName)!,
      startDate: new Date(household.joinDate),
      endDate: household.cancelDate ? new Date(household.cancelDate) : null,
      cohortWindow: household.cohortWindow,
    })),
  });
  log(`payments: ${paymentSeeds.length}`);
  await insertInChunks(payments, paymentSeeds, "payments");

  /* ---------- Stage 9: leads ---------- */

  const leadSeeds = generateLeads(faker, {
    today,
    windowStart,
    societyNames: societySeeds.map((society) => society.name),
    count: LEAD_COUNT,
  });
  log(`leads: ${leadSeeds.length}`);
  await insertInChunks(leads, leadSeeds, "leads");

  /* ---------- Stage 10: risk scores ---------- */

  const scored = await recomputeAllRiskScores(db);
  log(`risk scores recomputed for ${scored} households`);

  /* ---------- Summary ---------- */

  const finalCounts = await getTableCounts();
  log("Summary:");
  for (const entry of finalCounts) {
    log(`  ${entry.name.padEnd(16)} ${entry.rows}`);
  }
  log("Seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
