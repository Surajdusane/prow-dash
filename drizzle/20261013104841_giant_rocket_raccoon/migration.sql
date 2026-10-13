CREATE TYPE "complaint_category" AS ENUM('water_quality', 'service_delay', 'billing', 'device_malfunction', 'other');--> statement-breakpoint
CREATE TYPE "complaint_severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "dispenser_type" AS ENUM('own_device', 'standard', 'premium');--> statement-breakpoint
CREATE TYPE "household_status" AS ENUM('active', 'cancelled');--> statement-breakpoint
CREATE TYPE "lead_role" AS ENUM('rwa_secretary', 'resident', 'builder', 'other');--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM('paid', 'late', 'failed', 'pending');--> statement-breakpoint
CREATE TYPE "plan_name" AS ENUM('starter', 'standard', 'premium');--> statement-breakpoint
CREATE TYPE "subscription_status" AS ENUM('active', 'cancelled', 'paused');--> statement-breakpoint
CREATE TYPE "ticket_status" AS ENUM('open', 'in_progress', 'resolved');--> statement-breakpoint
CREATE TYPE "ticket_type" AS ENUM('filter_change', 'repair', 'installation', 'inspection');--> statement-breakpoint
CREATE TABLE "areas" (
	"id" serial PRIMARY KEY,
	"name" varchar(120) NOT NULL,
	"city" varchar(80) DEFAULT 'Bangalore' NOT NULL,
	"infrastructure_age_years" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complaints" (
	"id" serial PRIMARY KEY,
	"household_id" integer NOT NULL,
	"category" "complaint_category" NOT NULL,
	"severity" "complaint_severity" DEFAULT 'low'::"complaint_severity" NOT NULL,
	"date" date NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolution_date" date
);
--> statement-breakpoint
CREATE TABLE "dispensers" (
	"id" serial PRIMARY KEY,
	"household_id" integer NOT NULL,
	"type" "dispenser_type" NOT NULL,
	"install_date" date NOT NULL,
	"last_filter_change_date" date NOT NULL,
	"is_online" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" serial PRIMARY KEY,
	"society_id" integer NOT NULL,
	"flat_number" varchar(20) NOT NULL,
	"resident_name" varchar(120) NOT NULL,
	"phone" varchar(15),
	"join_date" date NOT NULL,
	"status" "household_status" DEFAULT 'active'::"household_status" NOT NULL,
	"cancel_date" date,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY,
	"name" varchar(120) NOT NULL,
	"society_name" varchar(150),
	"role" "lead_role",
	"source" varchar(60),
	"visit_date" date,
	"converted" boolean DEFAULT false NOT NULL,
	"flats_converted" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY,
	"household_id" integer NOT NULL,
	"subscription_id" integer NOT NULL,
	"billing_month" date NOT NULL,
	"amount" integer NOT NULL,
	"status" "payment_status" DEFAULT 'pending'::"payment_status" NOT NULL,
	"paid_date" date
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY,
	"name" "plan_name" NOT NULL UNIQUE,
	"monthly_price" integer NOT NULL,
	"deposit" integer NOT NULL,
	"includes_dispenser" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readings" (
	"id" serial PRIMARY KEY,
	"dispenser_id" integer NOT NULL,
	"recorded_at" timestamp NOT NULL,
	"tds_ppm" integer NOT NULL,
	"ph" numeric(3,1) NOT NULL,
	"hardness_mgl" integer NOT NULL,
	"purity_pct" numeric(4,1) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_tickets" (
	"id" serial PRIMARY KEY,
	"household_id" integer NOT NULL,
	"dispenser_id" integer NOT NULL,
	"technician_id" integer,
	"type" "ticket_type" NOT NULL,
	"status" "ticket_status" DEFAULT 'open'::"ticket_status" NOT NULL,
	"raised_date" date NOT NULL,
	"resolved_date" date,
	"sla_met" boolean
);
--> statement-breakpoint
CREATE TABLE "societies" (
	"id" serial PRIMARY KEY,
	"area_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"total_flats" integer NOT NULL,
	"onboarded_date" date NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY,
	"household_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" "subscription_status" DEFAULT 'active'::"subscription_status" NOT NULL,
	"billing_cycle" varchar(20) DEFAULT 'monthly' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technicians" (
	"id" serial PRIMARY KEY,
	"name" varchar(120) NOT NULL,
	"area_id" integer NOT NULL,
	"join_date" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id");--> statement-breakpoint
ALTER TABLE "dispensers" ADD CONSTRAINT "dispensers_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id");--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_society_id_societies_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id");--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_dispenser_id_dispensers_id_fkey" FOREIGN KEY ("dispenser_id") REFERENCES "dispensers"("id");--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id");--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_dispenser_id_dispensers_id_fkey" FOREIGN KEY ("dispenser_id") REFERENCES "dispensers"("id");--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_technician_id_technicians_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technicians"("id");--> statement-breakpoint
ALTER TABLE "societies" ADD CONSTRAINT "societies_area_id_areas_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id");--> statement-breakpoint
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_area_id_areas_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id");