import { defineRelations } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/* =========================================================
   ENUMS
   ========================================================= */

export const planNameEnum = pgEnum("plan_name", ["starter", "standard", "premium"]);

export const householdStatusEnum = pgEnum("household_status", ["active", "cancelled"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "paused"]);

export const dispenserTypeEnum = pgEnum("dispenser_type", ["own_device", "standard", "premium"]);

export const ticketTypeEnum = pgEnum("ticket_type", ["filter_change", "repair", "installation", "inspection"]);

export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved"]);

export const complaintCategoryEnum = pgEnum("complaint_category", [
  "water_quality",
  "service_delay",
  "billing",
  "device_malfunction",
  "other",
]);

export const complaintSeverityEnum = pgEnum("complaint_severity", ["low", "medium", "high"]);

export const paymentStatusEnum = pgEnum("payment_status", ["paid", "late", "failed", "pending"]);

export const leadRoleEnum = pgEnum("lead_role", ["rwa_secretary", "resident", "builder", "other"]);

/* =========================================================
   AREAS  (zones used for area-wise service demand analytics)
   ========================================================= */

export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  city: varchar("city", { length: 80 }).notNull().default("Bangalore"),
  infrastructureAgeYears: integer("infrastructure_age_years").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================================================
   SOCIETIES
   ========================================================= */

export const societies = pgTable(
  "societies",
  {
    id: serial("id").primaryKey(),
    areaId: integer("area_id")
      .notNull()
      .references(() => areas.id),
    name: varchar("name", { length: 150 }).notNull(),
    totalFlats: integer("total_flats").notNull(),
    onboardedDate: date("onboarded_date").notNull(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("societies_area_idx").on(t.areaId)]
);

/* =========================================================
   PLANS
   ========================================================= */

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: planNameEnum("name").notNull().unique(),
  monthlyPrice: integer("monthly_price").notNull(),
  deposit: integer("deposit").notNull(),
  includesDispenser: boolean("includes_dispenser").notNull().default(false),
});

/* =========================================================
   TECHNICIANS  (field-ops module)
   ========================================================= */

export const technicians = pgTable("technicians", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  areaId: integer("area_id")
    .notNull()
    .references(() => areas.id),
  joinDate: date("join_date").notNull(),
  active: boolean("active").notNull().default(true),
});

/* =========================================================
   HOUSEHOLDS
   ========================================================= */

export const households = pgTable(
  "households",
  {
    id: serial("id").primaryKey(),
    societyId: integer("society_id")
      .notNull()
      .references(() => societies.id),
    flatNumber: varchar("flat_number", { length: 20 }).notNull(),
    residentName: varchar("resident_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 15 }),
    joinDate: date("join_date").notNull(),
    status: householdStatusEnum("status").notNull().default("active"),
    cancelDate: date("cancel_date"),
    riskScore: integer("risk_score").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("households_society_idx").on(t.societyId), index("households_status_idx").on(t.status)]
);

/* =========================================================
   SUBSCRIPTIONS
   ========================================================= */

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    householdId: integer("household_id")
      .notNull()
      .references(() => households.id),
    planId: integer("plan_id")
      .notNull()
      .references(() => plans.id),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    billingCycle: varchar("billing_cycle", { length: 20 }).notNull().default("monthly"),
  },
  (t) => [
    index("subscriptions_status_idx").on(t.status),
    index("subscriptions_household_idx").on(t.householdId),
    index("subscriptions_plan_idx").on(t.planId),
  ]
);

/* =========================================================
   DISPENSERS  (IoT devices)
   ========================================================= */

export const dispensers = pgTable(
  "dispensers",
  {
    id: serial("id").primaryKey(),
    householdId: integer("household_id")
      .notNull()
      .references(() => households.id),
    type: dispenserTypeEnum("type").notNull(),
    installDate: date("install_date").notNull(),
    lastFilterChangeDate: date("last_filter_change_date").notNull(),
    isOnline: boolean("is_online").notNull().default(true),
  },
  (t) => [index("dispensers_household_idx").on(t.householdId), index("dispensers_online_idx").on(t.isOnline)]
);

/* =========================================================
   READINGS  (live/periodic water-quality telemetry)
   ========================================================= */

export const readings = pgTable(
  "readings",
  {
    id: serial("id").primaryKey(),
    dispenserId: integer("dispenser_id")
      .notNull()
      .references(() => dispensers.id),
    recordedAt: timestamp("recorded_at").notNull(),
    tdsPpm: integer("tds_ppm").notNull(),
    ph: decimal("ph", { precision: 3, scale: 1 }).notNull(),
    hardnessMgl: integer("hardness_mgl").notNull(),
    purityPct: decimal("purity_pct", { precision: 4, scale: 1 }).notNull(),
  },
  (t) => [
    index("readings_dispenser_recorded_idx").on(t.dispenserId, t.recordedAt),
    index("readings_recorded_idx").on(t.recordedAt),
  ]
);

/* =========================================================
   SERVICE TICKETS  (maintenance / predictive-service module)
   ========================================================= */

export const serviceTickets = pgTable(
  "service_tickets",
  {
    id: serial("id").primaryKey(),
    householdId: integer("household_id")
      .notNull()
      .references(() => households.id),
    dispenserId: integer("dispenser_id")
      .notNull()
      .references(() => dispensers.id),
    technicianId: integer("technician_id").references(() => technicians.id),
    type: ticketTypeEnum("type").notNull(),
    status: ticketStatusEnum("status").notNull().default("open"),
    raisedDate: date("raised_date").notNull(),
    resolvedDate: date("resolved_date"),
    slaMet: boolean("sla_met"),
  },
  (t) => [
    index("service_tickets_status_idx").on(t.status),
    index("service_tickets_raised_date_idx").on(t.raisedDate),
    index("service_tickets_technician_idx").on(t.technicianId),
  ]
);

/* =========================================================
   COMPLAINTS  (churn-risk module)
   ========================================================= */

export const complaints = pgTable(
  "complaints",
  {
    id: serial("id").primaryKey(),
    householdId: integer("household_id")
      .notNull()
      .references(() => households.id),
    category: complaintCategoryEnum("category").notNull(),
    severity: complaintSeverityEnum("severity").notNull().default("low"),
    date: date("date").notNull(),
    resolved: boolean("resolved").notNull().default(false),
    resolutionDate: date("resolution_date"),
  },
  (t) => [index("complaints_household_date_idx").on(t.householdId, t.date), index("complaints_date_idx").on(t.date)]
);

/* =========================================================
   PAYMENTS  (revenue analytics + churn signal)
   ========================================================= */

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    householdId: integer("household_id")
      .notNull()
      .references(() => households.id),
    subscriptionId: integer("subscription_id")
      .notNull()
      .references(() => subscriptions.id),
    billingMonth: date("billing_month").notNull(),
    amount: integer("amount").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    paidDate: date("paid_date"),
  },
  (t) => [
    index("payments_billing_month_idx").on(t.billingMonth),
    index("payments_subscription_idx").on(t.subscriptionId),
    index("payments_household_idx").on(t.householdId),
  ]
);

/* =========================================================
   LEADS  (sales/conversion funnel)
   ========================================================= */

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    societyName: varchar("society_name", { length: 150 }),
    role: leadRoleEnum("role"),
    source: varchar("source", { length: 60 }),
    visitDate: date("visit_date"),
    converted: boolean("converted").notNull().default(false),
    flatsConverted: integer("flats_converted").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("leads_visit_date_idx").on(t.visitDate), index("leads_converted_idx").on(t.converted)]
);

/* =========================================================
   RELATIONS  (Drizzle v1 - centralized defineRelations)
   ========================================================= */

export const relations = defineRelations(
  {
    areas,
    societies,
    plans,
    technicians,
    households,
    subscriptions,
    dispensers,
    readings,
    serviceTickets,
    complaints,
    payments,
    leads,
  },
  (r) => ({
    areas: {
      societies: r.many.societies(),
      technicians: r.many.technicians(),
    },
    societies: {
      area: r.one.areas({
        from: r.societies.areaId,
        to: r.areas.id,
      }),
      households: r.many.households(),
    },
    plans: {
      subscriptions: r.many.subscriptions(),
    },
    technicians: {
      area: r.one.areas({
        from: r.technicians.areaId,
        to: r.areas.id,
      }),
      serviceTickets: r.many.serviceTickets(),
    },
    households: {
      society: r.one.societies({
        from: r.households.societyId,
        to: r.societies.id,
      }),
      subscriptions: r.many.subscriptions(),
      dispensers: r.many.dispensers(),
      serviceTickets: r.many.serviceTickets(),
      complaints: r.many.complaints(),
      payments: r.many.payments(),
    },
    subscriptions: {
      household: r.one.households({
        from: r.subscriptions.householdId,
        to: r.households.id,
      }),
      plan: r.one.plans({
        from: r.subscriptions.planId,
        to: r.plans.id,
      }),
      payments: r.many.payments(),
    },
    dispensers: {
      household: r.one.households({
        from: r.dispensers.householdId,
        to: r.households.id,
      }),
      readings: r.many.readings(),
      serviceTickets: r.many.serviceTickets(),
    },
    readings: {
      dispenser: r.one.dispensers({
        from: r.readings.dispenserId,
        to: r.dispensers.id,
      }),
    },
    serviceTickets: {
      household: r.one.households({
        from: r.serviceTickets.householdId,
        to: r.households.id,
      }),
      dispenser: r.one.dispensers({
        from: r.serviceTickets.dispenserId,
        to: r.dispensers.id,
      }),
      technician: r.one.technicians({
        from: r.serviceTickets.technicianId,
        to: r.technicians.id,
      }),
    },
    complaints: {
      household: r.one.households({
        from: r.complaints.householdId,
        to: r.households.id,
      }),
    },
    payments: {
      household: r.one.households({
        from: r.payments.householdId,
        to: r.households.id,
      }),
      subscription: r.one.subscriptions({
        from: r.payments.subscriptionId,
        to: r.subscriptions.id,
      }),
    },
    leads: {},
  })
);
