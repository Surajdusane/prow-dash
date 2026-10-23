# Phase 2 - API Layer

> Read `prompt/00-master-plan.md` first (§7 route specs = the API surface). Work in this repo; follow `AGENTS.md`.

## Goal

Build the complete tRPC API for all 8 routes: zod input schemas (`src/trpc/schema`), Drizzle queries (`src/db/queries`), thin routers (`src/trpc/routers`) registered in `_app.ts`.

## Structure

```
src/trpc/schema/       common.ts (pagination), overview.ts, service-ops.ts, customers.ts,
                       devices.ts, revenue.ts, societies.ts, leads.ts, impact.ts, index.ts
src/db/queries/        overview.ts, service-ops.ts, customers.ts, devices.ts, revenue.ts,
                       societies.ts, leads.ts, impact.ts, tickets.ts, complaints.ts,
                       payments.ts, leads-mutations.ts, risk.ts (from Phase 1), index.ts
src/trpc/routers/      overview.ts, service-ops.ts, customers.ts, devices.ts, revenue.ts,
                       societies.ts, leads.ts, impact.ts → registered in _app.ts
```

Rules: routers stay thin (input validation + call query fn). Every input validated with zod (Zod v4). Export query param types alongside functions. Use `authorizedProcedure` (repo convention). Relational queries are available: `db.query.households.findMany({ with: { society: ..., complaints: ... } })` (relations wired in `src/db/index.ts`).

## Procedures to implement

### `overview` (route `/`)
- `getKpis` → { activeHouseholds, mrr, churnRate90d, openTickets, newThisMonth, avgPurity7d }
- `getRevenueTrend` → 18 points [{ month, billed, collected }] from payments grouped by `date_trunc('month', billing_month)`
- `getHouseholdGrowth` → [{ month, active, cancelled }] cumulative from join/cancel dates
- `getPlanMix` → [{ plan, count, share }] over active subscriptions
- `getAreaHealth` → [{ area, households, openTickets, avgTds30d, slaMetPct90d }]

### `serviceOps` (route `/service-ops`)
- `getBoard({ areaId?, type?, search? })` → tickets with household/society/area/technician, newest first. Client derives the 4 columns: New (open, no tech), Assigned (open + tech), In Progress, Resolved (last 30d, cap length)
- `getAreaDemand` → per area: tickets90d, per100Households, infraAgeYears, avgResolutionDays
- `getPredictive` → top 25 dispensers: household, area, filterAgeDays, latestTds, tdsSlope7d (linear slope of last 4–6 readings), reason string ("TDS rising 32%/wk" / "filter 118d old" / both)
- `getSlaStats` → { open, overdue7d, avgResolutionDays, slaMetPct90d }
- `getTechnicianWorkload` → per tech: area, openTickets, resolved30d, avgResolutionDays
- `getHouseholdsLite` → id + label (flat, society) for pickers
- Mutations: `createTicket({ householdId, type })` (resolves dispenser, sets raisedDate today, status open) · `updateStatus({ id, status })` (resolve → resolvedDate today + compute slaMet vs Phase-1 targets) · `assign({ id, technicianId })` · `remove({ id })`

### `customers` (route `/customers`)
- `getRiskTable({ page, limit, sort, dir, riskBand?, areaId?, status? })` → rows (household, society, area, plan, tenureDays, riskScore, complaints90d, latePayments6mo, lastComplaintDate, status) + total count. Risk bands: low 0–33, medium 34–66, high 67+
- `getRiskDistribution` → band buckets with counts
- `getComplaintTrend` → 12 months × category counts
- `getById({ householdId })` → full profile: household + society + area, subscription + plan, dispenser, last 30d readings, tickets, complaints, payments
- Mutations: `recomputeRisk({ householdId? })` (all or one, reuses `src/db/queries/risk.ts`, returns count) · `createComplaint({ householdId, category, severity, date })` · `resolveComplaint({ id })` (sets resolved + resolutionDate)

### `devices` (route `/devices`)
- `getFleet({ page, limit, areaId?, type?, online? })` → rows (dispenser, household, society/area, type, isOnline, lastReadingAt, latestTds, latestPurity, filterAgeDays, flag) + total
- `getReadings({ dispenserId, days })` → [{ recordedAt, tdsPpm, ph, purityPct }] + dispenser/household meta
- `getAnomalies` → latest reading per dispenser where tdsPpm > 450 OR purityPct < 85 OR offline > 7d; severity derived
- `getFleetStats` → { onlinePct, avgPurity7d, needsServiceCount, offlineCount }

### `revenue` (route `/revenue`)
- `getKpis` → { mrr, arpu, activeSubs, failedPctThisMonth, collectionsRate90d }
- `getMrrTrend` → 18 months: sum of active-subscription plan prices at each month end (from start/end dates - no snapshot table needed)
- `getPlanMixTrend` → 18 months × plan subscription counts (stacked)
- `getPaymentStatusByMonth` → 12 months [{ month, paid, late, failed, pending }]
- `getCohortRetention` → cohorts by join month: { cohortMonth, size, retention[] } where active-at-t ⇔ `joinDate ≤ t AND (cancelDate IS NULL OR cancelDate > t)`. Fetch ~1.2k households once and shape server-side - simpler and honest
- `getOverdue({ page, limit })` → late/failed payments with household + month + amount
- Mutation: `markPaid({ paymentId })` (status → paid, paidDate today)

### `societies` (route `/societies`)
- `getKpis` → { societies, avgPenetration, flatsCovered, areas }
- `getList({ page, limit, areaId?, sort, search? })` → rows (society, area, totalFlats, subscribed, penetrationPct, onboardedDate, openTickets, avgTds30d) + total
- `getGrowthTrend` → monthly cumulative households per area (top 8 areas; rest grouped as "Other")
- `getAreaPenetration` → per area: penetration %, infra age, ticketsPer100
- `getById({ societyId })` → society + per-plan counts + top-5 risk households

### `leads` (route `/leads`)
- `getKpis` → { totalLeads, visitRate, conversionRate, flatsConvertedQtd }
- `getFunnel` → [{ stage: leads | visits | converted, count, pctOfLeads }]
- `getBySource` → per source: leads, visits, converted, conversionRate
- `getList({ page, limit, source?, converted? })`
- Mutations: `create({ name, societyName?, role?, source })` · `update({ id, visitDate?, converted?, flatsConverted? })`

### `impact` (route `/sustainability`)
- `getTotals` → { litresServed, jarsAvoided, householdsServed, monthsLive } - subscription-days × plan litres/day (8/12/18), ÷ 20L per jar
- `getMonthlyTrend` → last 24 months litres + jarsAvoided
- `getByPlan` → litres + jars per plan

## Query performance notes

- "Latest reading per dispenser": pre-filter by recency (`recorded_at >= now() - interval '30 days'`) **first**, then `DISTINCT ON (dispenser_id) ... ORDER BY dispenser_id, recorded_at DESC`. Indexes from Phase 0 make this fast.
- Server paging: `limit/offset` + a parallel `count(*)` for totals (wrap in one `db.select` where possible).
- Aggregates via `sql<number>` + `.mapWith(Number)`; group with `date_trunc`.
- Cap payloads: charts take ≤ 60 points; tables page at 25.

## Verification

- `bun run check-types` clean.
- Smoke-test every procedure against the seeded DB (temporary script using the tRPC caller or a throwaway page - delete after).

## Definition of done

- [ ] All routers registered in `src/trpc/routers/_app.ts`
- [ ] Schema index re-exports all zod schemas
- [ ] Every procedure returns sensible data from the live seeded DB
- [ ] check-types green; changes left uncommitted
