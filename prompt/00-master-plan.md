# ProWater Internal Monitoring Dashboard — Master Plan

## 1. Product & goal

A portfolio project: an internal ops/monitoring dashboard for **ProWater**, a piped RO water subscription service in Bangalore. It models the real business chain — societies → households → subscriptions → IoT dispensers → service/complaints/payments — and surfaces what an ops team actually needs: predictive maintenance, churn risk, revenue health, fleet monitoring, expansion and sales funnel.

This is the **internal dashboard** (not a customer-facing page). Every route reads from one shared Postgres schema — no separate data silos.

## 2. Locked decisions

- **No auth gate** — fully public deployed demo; all mutations stay live.
- **@dnd-kit** for the Kanban drag-and-drop.
- **All 8 routes**, built end-to-end in order: `/` → `/service-ops` → `/customers` → `/devices` → `/revenue` → `/societies` → `/leads` → `/sustainability`.
- **Strictly tRPC** for app data. `src/db/queries` (Drizzle) → `src/trpc/routers` → feature hooks. No REST route handlers for data (only the optional cron endpoint).
- **evilcharts** for all charts (installed at `src/components/evilcharts`), not Recharts/Tremor.
- 24 months of seeded history (~250k telemetry rows). Static data, no live simulation.

## 3. Actual stack (what's in the repo)

- Next.js 16 (App Router, React 19.3, Tailwind v4, `reactCompiler: true`)
- tRPC v11 + TanStack Query v5 + SuperJSON + Zod v4
- Drizzle ORM v1 RC (`defineRelations`) + Neon serverless HTTP driver
- evilcharts (area, bar, line, pie, radial, radar, composed primitives + 12 blocks)
- coss/shadcn UI kit (`src/components/ui`), `toastManager`, fumadocs (unrelated, leave as-is)
- `tsx` available for scripts (resolves tsconfig `@/` paths)

## 4. Data model (already built: `src/db/schema.ts`)

`areas` (infrastructureAgeYears drives service demand) → `societies` → `households` (denormalized `riskScore`, `status`, `cancelDate`) → `subscriptions` (→ `plans`), `dispensers` (→ `readings`, isOnline, lastFilterChangeDate), `serviceTickets` (type/status/technician/SLA), `complaints` (category/severity/resolution), `payments` (billingMonth/status), plus standalone `leads` funnel and `technicians` per area.

**Planned additions (Phase 0):** indexes only — readings(dispenser_id, recorded_at), readings(recorded_at), payments(billing_month/subscription_id/household_id), service_tickets(status/raised_date/technician_id), complaints(household_id, date) + (date), households(society_id/status), dispensers(household_id/is_online), subscriptions(status/household_id/plan_id), societies(area_id), leads(visit_date/converted).

## 5. Repo conventions (non-negotiable, from AGENTS.md)

- Strictly tRPC; **never fetch data directly in client pages** — server pages `batchPrefetch` → `HydrateClient` + `ErrorBoundary` + `Suspense` → client components use feature hooks (`useSuspenseQuery`).
- Feature folder structure: `src/features/<name>/{components,hooks,server,schema,utils,types,index.ts}`.
- One hook per query/mutation; every mutation shows a `toastManager.add({ title, description, type })` on success and error.
- `use-confirm` (`ConfirmationDialog`, `confirm`) for all confirmations.
- Zod schema for every input — `src/trpc/schema/*` (procedure inputs), feature `schema/` for feature-local form schemas.
- DB queries in `src/db/queries`; routers thin (`src/trpc/routers/*`, registered in `_app.ts`).
- All imports from `@/`. Tailwind only. Prefer existing coss/shadcn components; install via `bunx --bun shadcn@latest add @coss/<name>` only if missing.
- Charts: evilcharts first; client components inside fixed-height containers.
- Per Next.js agent rules: consult `node_modules/next/dist/docs/` before writing route code; run `bunx --no-install --package @tanstack/intent intent list` + load matching skill before editing files.

## 6. Seed data plan (Phase 1)

**Volumes:** 8 areas · 50 societies · ~1,150 households (≈85% active) · ~1,000 dispensers · ~250k readings · ~7k tickets · ~2.5k complaints · ~25k payments · ~450 leads · 12 technicians. Deterministic (`faker.seed(42)`, fixed anchor), 24-month history.

**Injected patterns (so dashboard insights are real):**

| Pattern | How |
|---|---|
| Area imbalance | 2–3 areas with high `infrastructureAgeYears` → denser tickets per 100 households |
| Filter degradation | Per-dispenser timeline: TDS/purity drifts between filter changes, resets sharply after |
| Causal tickets | Repair/filter tickets **derived from** threshold crossings in the same timeline → the predictive list is genuinely predictive |
| Seasonality | Monsoon: hardness/repair spikes; summer: usage/filter spikes |
| Risk cohort | ~12% of households get complaint clusters + late/failed payments, some later cancel → validates `riskScore` |
| Growth curve | Societies onboard in waves over months 1–14; households follow; Premium mix grows over time |
| Technician imbalance | 2–3 technicians carry disproportionate load in high-infra areas |

**Risk score** — shared function `recomputeAllRiskScores(db)` in `src/db/queries/risk.ts`, used by: seed post-processing, the "Recompute" mutation on `/customers`, and the optional cron. Weights: unresolved/high/recent complaints, late+failed payments (6 mo), SLA misses, short tenure. 0–100.

**Documented assumptions:** SLA targets — repair 48h, filter_change 72h, inspection 96h, installation 120h. Sustainability litres — active subscription-days × plan litres/day (starter 8 / standard 12 / premium 18), 1 jar = 20L. Plans — starter ₹499 (own device), standard ₹799, premium ₹1,199.

## 7. Route-by-route spec

### `/` — Exec Overview → `features/overview`
- **KPIs:** active households · MRR · 90-day churn rate · open tickets · new households this month · fleet avg purity (7d)
- **Table:** area health strip (area, households, open tickets, avg TDS, SLA %)
- **Charts:** billing/revenue trend 18 mo → `EChartsAreaChart` · household growth (cumulative) → `EChartsAreaChart` · plan mix → `EChartsPieChart` donut
- **tRPC:** `overview.getKpis` · `getRevenueTrend` · `getHouseholdGrowth` · `getPlanMix` · `getAreaHealth`

### `/service-ops` — Field Ops → `features/service-ops`
- **KPIs:** open tickets · overdue >7d · avg resolution days · SLA met % (90d)
- **Kanban (dnd-kit):** New (open, unassigned) → Assigned (open + tech) → In Progress → Resolved (30d); drag = optimistic `updateStatus`/`assign` mutation
- **Table:** predicted next service (top 25): household, area, filter age, latest TDS, TDS slope 7d, reason string
- **Charts:** area demand (tickets 90d + per-100-households, infra age) → `EChartsBarChart` grouped · technician workload → `EChartsBarChart` or `EChartsRadarChart` · SLA gauge → `EChartsRadialChart`
- **Actions:** create ticket dialog, assign select, detail drawer, delete with `use-confirm`
- **tRPC:** `getBoard` · `getAreaDemand` · `getPredictive` · `getSlaStats` · `getTechnicianWorkload` · `getHouseholdsLite` · mutations `createTicket`, `updateStatus`, `assign`, `remove`

### `/customers` — Churn & Risk → `features/customers`
- **KPIs:** active · high-risk count · churned last 90d · avg tenure
- **Table:** sortable risk table (household, society/area, plan, tenure, risk score, complaints 90d, late/failed 6mo, last complaint, status) — server-paged, filters: risk band/area/status
- **Charts:** risk band distribution → `EChartsPieChart` donut · complaint trend 12 mo by category → `EChartsLineChart`
- **Drawer:** full household (profile, subscription, dispenser, readings sparkline, tickets, complaints, payments) + add/resolve complaint + recompute risk
- **tRPC:** `getRiskTable` · `getRiskDistribution` · `getComplaintTrend` · `getById` · mutations `recomputeRisk`, `createComplaint`, `resolveComplaint`

### `/devices` — IoT Fleet → `features/devices`
- **KPIs:** online % · avg purity (7d) · needs service · offline >7d
- **Table:** fleet (dispenser, household, area, type, online, last reading, latest TDS/pH/purity, filter age, flag)
- **Charts:** selected device 30/90d readings → `EChartsComposedChart` (TDS + purity dual axis) · online rate → `EChartsRadialChart` gauge
- **Anomaly list:** TDS > 450 or purity < 85% or offline, severity-sorted
- **tRPC:** `getFleet` · `getReadings` · `getAnomalies` · `getFleetStats` (read-only)

### `/revenue` — Subscriptions & Billing → `features/revenue`
- **KPIs:** MRR · ARPU · active subs · failed % this month · collections rate (90d)
- **Charts:** MRR trend 18 mo → `EChartsAreaChart` · plan mix over time stacked → `EChartsBarChart` · payment status per month stacked → `EChartsBarChart`
- **Tables:** cohort retention matrix (join-month × months since join, heat cells, computed from joinDate/cancelDate) · overdue/failed payments with `markPaid`
- **tRPC:** `getKpis` · `getMrrTrend` · `getPlanMixTrend` · `getPaymentStatusByMonth` · `getCohortRetention` · `getOverdue` · mutation `markPaid`

### `/societies` — Expansion & Penetration → `features/societies`
- **KPIs:** societies · avg penetration · flats covered · areas
- **Table:** society, area, total flats, subscribed, penetration %, onboarded, open tickets, avg TDS (30d); drawer: stats + top-risk households
- **Charts:** cumulative households by area stacked → `EChartsAreaChart` · penetration by area → `EChartsBarChart`
- **tRPC:** `getKpis` · `getList` · `getGrowthTrend` · `getAreaPenetration` · `getById`

### `/leads` — Sales Funnel → `features/leads`
- **KPIs:** leads · visit rate · conversion rate · flats converted (quarter)
- **Charts:** funnel Leads → Visits → Converted as horizontal `EChartsBarChart` with % labels (no funnel primitive in evilcharts) · conversion by source → `EChartsBarChart` grouped
- **Table:** leads list with filters
- **tRPC:** `getKpis` · `getFunnel` · `getBySource` · `getList` · mutations `create`, `update`

### `/sustainability` — Impact → `features/sustainability`
- **Tiles:** litres served (est.) · 20L jars avoided · households served · months live
- **Charts:** cumulative litres + jars monthly → `EChartsAreaChart` · by plan → `EChartsBarChart`
- **Note card:** method transparency (subscription-days × plan litres/day ÷ 20L per jar)
- **tRPC:** `getTotals` · `getMonthlyTrend` · `getByPlan`

## 8. Build order

| Phase | Deliverable |
|---|---|
| 0 Foundations | deps, indexes migration, routes/nav restructure, `use-confirm`, KPI card, gallery → `/dev/charts` |
| 1 Seed | full 24-mo dataset + risk scores, sanity-verified |
| 2 API | queries + schemas + 8 routers, typecheck clean |
| 3 Overview + Service Ops | first two routes end-to-end incl. dnd-kit kanban |
| 4 Customers + Devices | risk table/drawer/recompute + fleet/readings/anomalies |
| 5 Revenue + Societies + Leads + Sustainability | remaining four routes |
| 6 Polish + Deploy | skeletons/empty states, README, Neon + Vercel live |

## 9. Deployment plan (Vercel + Neon)

1. Local gates green: `bun run check-types && bun run lint && bun run build`.
2. Neon pooled connection string → `.env` → `bun run db:migrate` → `bun run db:seed` (runs from local machine against remote Neon — same DB Vercel will read).
3. Vercel: import GitHub repo → Next.js preset auto-detected → Node 22.x; env vars: `DATABASE_URL` (pooled), `NEXT_PUBLIC_APP_URL` (optional `CRON_SECRET` if cron).
4. Dashboard pages are `force-dynamic` → no build-time DB dependency, always live data.
5. Optional cron: `vercel.json` → `{ "crons": [{ "path": "/api/cron/risk-recompute", "schedule": "0 2 * * *" }] }` + `src/app/api/cron/risk-recompute/route.ts` guarded by `CRON_SECRET`, reusing `recomputeAllRiskScores`.
6. Smoke test every route + one mutation per mode on prod.
7. Cost: Vercel Hobby + Neon free = $0. Known trade-offs: Neon cold start (~1s), preview deploys share the prod DB.
