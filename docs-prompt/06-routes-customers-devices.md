# Prompt 06 — Customers, Devices, Fleet

Read `docs-prompt/00-readme.md` first, then reuse the route-page template from `docs-prompt/05-routes-overview-service-ops.md`.

## Goal

Write:

- `src/content/docs/routes/customers.mdx`
- `src/content/docs/routes/devices.mdx`
- `src/content/docs/routes/fleet.mdx`

Each page must explain:
1. The business decision.
2. The options considered.
3. What is on screen.
4. The seed/data logic.
5. The chart → data → code mapping.
6. The interactions.
7. A code map.
8. What a reviewer should click/read.
9. Trade-offs.

## 1. `routes/customers.mdx` — `/customers`

Frontmatter:

```yaml
---
title: "/customers — Churn risk"
description: Score the book, surface high-risk households, and act on complaints before they cancel.
---
```

### Why this route exists

- Retention is cheaper than acquisition.
- Support needs a ranked list of households to call, with the reason behind each score.
- The page must answer: *who is at risk, why, and what can we do now?*

### What I chose — and what I left out

| Option | Why I rejected it | What I chose instead |
|---|---|---|
| A chart of churn over time | Doesn’t tell support who to call | Risk table first |
| Only a risk score column | Not explainable | Score + band + signals + drawer |
| One global list, no filters | Too broad for a support team | Band, area, status filters |
| ML score | No labelled data; hard to explain | Transparent 0–100 heuristic |

### What’s on screen

Live routes: `/customers`, with the household drawer as the detail state.

#### KPI row

- Active households, high-risk count, average risk, complaints 30d, etc. Read the actual `getKpis` return shape before writing the list. Do not invent KPI names.

#### Risk table

- Server-paged, sortable, filterable by risk band, area, and status.
- Columns include household, society, area, risk score, band, plan, last complaint, open tickets.
- **Why a table:** this is an action list; support needs sorting and filtering, not a scatter plot.
- **Data:** `getRiskTable` → `households`, `societies`, `areas`, `subscriptions`, `plans`, `complaints`, `service_tickets`.
- **Code:** `src/features/customers/components/risk-table/*`, `use-get-risk-table.ts`.

#### Risk distribution donut

- Low / medium / high bands.
- **Why:** part-to-whole with three categories; shows whether risk is concentrated.
- **Data:** `getRiskDistribution` → `households.risk_score`.
- **Code:** `risk-distribution-card.tsx`.

#### Complaint trend

- Multi-line: water quality, service delay, billing, device malfunction, other — 12 months.
- **Why:** a category trend explains *what kind* of risk is rising.
- **Data:** `getComplaintTrend` → `complaints`.
- **Code:** `complaint-trend-card.tsx`.

#### Household drawer

- Risk ring, plan/subscription, readings sparkline, complaints, payments, tickets.
- **Why:** the drawer is the “why” behind the score; it turns a number into evidence.
- **Data:** `getHouseholdProfile` → `households`, `subscriptions`, `plans`, `dispensers`, `readings`, `complaints`, `payments`, `service_tickets`.
- **Code:** `src/features/customers/components/household-drawer/*`, `use-get-household-profile.ts`.

#### Add / resolve complaint

- Add complaint dialog; resolve complaint action.
- Both invalidate the household profile, risk table, distribution, complaint trend, and KPIs.
- Use toast and `ConfirmationDialog` where appropriate.

#### Recompute risk

- One-click mutation; recomputes all households (or one) with the shared function.
- **Why:** shows the score is not a static seed column; it can be recalculated from current signals.
- **Code:** `src/features/customers/components/recompute-risk-button.tsx`, `use-recompute-risk.ts`, `src/db/queries/risk.ts`.

### The data behind it

- Seed injects a ~13% risk cohort with 2–4 complaints, late/failed payments, and ~60% later cancellation.
- Risk windows: complaints 90d, payments 6mo, SLA misses 12mo, tenure current.
- Risk bands: low <34, medium 34–66, high ≥67.
- The same `computeHouseholdRisk` function is used by the seed and the recompute mutation.

### Chart → data → code

| Section | Visual | Why | Data source | Component |
|---|---|---|---|---|
| KPI row | KPI tiles | Fast scan | `getKpis` | `kpi-row.tsx` |
| Risk table | Table | Triage list | `getRiskTable` | `risk-table/*` |
| Risk distribution | Donut | Part-to-whole, 3 bands | `getRiskDistribution` | `risk-distribution-card.tsx` |
| Complaint trend | Multi-line | Category trends | `getComplaintTrend` | `complaint-trend-card.tsx` |
| Household detail | Drawer | Evidence on demand | `getHouseholdProfile` | `household-drawer/*` |

### Code map

| Layer | File | What it does |
|---|---|---|
| Page | `src/app/(root)/(dashboard)/customers/page.tsx` | Prefetch + Suspense layout |
| Server prefetch | `src/features/customers/server/index.ts` | `batchPrefetchCustomers` |
| Hooks | `src/features/customers/hooks/*` | KPI, table, distribution, trend, drawer, mutations |
| Components | `src/features/customers/components/*` | Table, charts, drawer, dialogs |
| Router | `src/trpc/routers/customers.ts` | Procedures |
| Query | `src/db/queries/customers.ts` | Table + profile queries |
| Query | `src/db/queries/risk.ts` | Score + recompute |
| Query | `src/db/queries/complaints.ts` | Complaint trend/mutations |
| Seed | `src/db/seed/generators/households.ts` | Risk cohort |
| Seed | `src/db/seed/generators/complaints.ts` | Complaint clusters |
| Seed | `src/db/seed/generators/payments.ts` | Late/failed payments |

### What to notice as a reviewer

1. Filter to high risk and open a household; the drawer shows the exact complaints, payments, and tickets behind the score.
2. Read `computeHouseholdRisk`; the scoring model is one readable function, not a black box.
3. Resolve a complaint, then recompute risk; the table and distribution refresh.

### Trade-offs & next

- The score is a ranking heuristic, not a probability.
- Weights are hand-tuned and global.
- No suggested next action (call, discount, filter change).
- No per-plan or per-area calibration.
- No real outcome tracking in the demo.

## 2. `routes/devices.mdx` — `/devices`

Frontmatter:

```yaml
---
title: "/devices — IoT fleet monitoring"
description: Connectivity, telemetry trends, and the anomalies that need a field visit.
---
```

### Why this route exists

- The dispenser fleet is the physical edge of the business.
- Ops needs to know: *which devices are offline, degrading, or producing bad water?*
- The page must turn ~1,000 devices into a short attention list.

### What I chose — and what I left out

| Option | Why I rejected it | What I chose instead |
|---|---|---|
| A table of every device | Too much for a monitoring overview | Aggregate charts + anomaly feed |
| One chart per metric | No prioritization | Anomaly mix + trend + online gauge |
| A map of devices | Interesting, but not the first decision | Severity-sorted feed |
| Real-time streaming | Overkill for a demo | Daily aggregates + latest readings |

### What’s on screen

Live routes: `/devices`, with the device drawer as the detail state.

#### KPI row

Read `getFleetStats` for the actual fields. Likely: total devices, online rate, anomalies, average TDS/purity. Do not invent.

#### Anomaly mix

- **Visual:** donut by most urgent signal.
- **Why:** shows what kind of problem dominates the fleet.
- **Data:** `getAnomalies` → `dispensers`, `readings`.
- **Code:** `anomaly-mix-card.tsx`.

#### Telemetry trend

- **Visual:** composed chart with two lines: fleet-wide average TDS + average purity, dual axis.
- **Why:** two units on one timeline; the relationship is the insight.
- **Data:** `getReadingsTrend` → `readings`.
- **Code:** `readings-trend-card.tsx`.

#### Fleet online

- **Visual:** radial gauge.
- **Why:** one percentage against a target.
- **Data:** `getFleetStats` → `dispensers`.
- **Code:** `fleet-online-gauge.tsx`.

#### Anomaly feed

- **Visual:** severity-sorted list.
- **Why:** an action list, not a chart.
- **Data:** `getAnomalies` → latest readings + dispenser state.
- **Code:** `anomaly-panel.tsx`.

#### Device drawer

- **Visual:** drawer with device metadata + readings chart.
- **Why:** detail on demand without leaving the page.
- **Data:** `getReadings` → `readings`.
- **Code:** `device-drawer/*`.

### The data behind it

- Seed creates a dispenser life with filter cycles; readings every 2–3 days.
- TDS climbs on a convex curve; purity tracks TDS downward; hardness drifts with monsoon.
- Offline flags are injected; anomalies are derived from latest readings (TDS, purity, hardness, filter age, offline).
- Read the actual anomaly thresholds/logic in `src/db/queries/devices.ts` before writing them.

### Chart → data → code

| Section | Visual | Why | Data source | Component |
|---|---|---|---|---|
| KPI row | KPI tiles | Fast scan | `getFleetStats` | `kpi-row.tsx` |
| Anomaly mix | Donut | Problem composition | `getAnomalies` | `anomaly-mix-card.tsx` |
| Telemetry trend | Dual-line composed | Two units over time | `getReadingsTrend` | `readings-trend-card.tsx` |
| Fleet online | Radial gauge | Single % vs target | `getFleetStats` | `fleet-online-gauge.tsx` |
| Anomaly feed | List | Action list | `getAnomalies` | `anomaly-panel.tsx` |
| Device detail | Drawer + chart | Detail on demand | `getReadings` | `device-drawer/*` |

### Code map

| Layer | File | What it does |
|---|---|---|
| Page | `src/app/(root)/(dashboard)/devices/page.tsx` | Prefetch + Suspense layout |
| Server prefetch | `src/features/devices/server/index.ts` | `batchPrefetchDevicesOverview` |
| Hooks | `src/features/devices/hooks/*` | Stats, trend, anomalies, readings |
| Components | `src/features/devices/components/*` | Charts, feed, drawer |
| Router | `src/trpc/routers/devices.ts` | Procedures |
| Query | `src/db/queries/devices.ts` | Fleet stats, trend, anomalies, readings |
| Seed | `src/db/seed/generators/dispensers.ts` | Device lifecycle |
| Seed | `src/db/seed/generators/readings.ts` | Telemetry |

### What to notice as a reviewer

1. The anomaly feed is sorted by urgency, not by device ID.
2. Open a device drawer; the readings chart shows the filter cycle, not random noise.
3. Read `src/db/queries/devices.ts`; anomaly detection is deterministic and explainable.

### Trade-offs & next

- Anomaly rules are heuristics.
- No real-time ingestion or alerting.
- No device model-specific thresholds.
- No maintenance cost model.
- The drawer loads on demand; no prefetch for every device.

## 3. `routes/fleet.mdx` — `/devices/fleet`

Frontmatter:

```yaml
---
title: "/devices/fleet — Full dispenser fleet"
description: Every active dispenser with its latest telemetry, filter age, and connectivity state.
---
```

### Why this route exists

- The devices overview shows the fleet; the fleet page answers: *what is the state of this specific dispenser?*
- It is the lookup and comparison surface for ops and support.

### What I chose — and what I left out

| Option | Why I rejected it | What I chose instead |
|---|---|---|
| Cards per device | Too many devices; hard to compare | Table with filters |
| Infinite scroll | Harder to scan/sort | Server pagination |
| One row per reading | Explodes the table | Latest reading per device |
| A separate detail page | Slower context switching | Shared device drawer |

### What’s on screen

Live route: `/devices/fleet`.

- Filter toolbar: area, type, status.
- Table columns: household, society, area, type, latest TDS, pH, purity, filter age, online, flags.
- Server-side pagination and sorting.
- Shared device drawer for detail.

### The data behind it

- One dispenser per household.
- Latest reading per dispenser (not the full time series).
- Filter age from `last_filter_change_date`.
- Online state from `dispensers.is_online`.
- Read `getFleet` in `src/db/queries/devices.ts` for the exact shape.

### Chart → data → code

| Section | Visual | Why | Data source | Component |
|---|---|---|---|---|
| Fleet table | Table | Lookup + comparison | `getFleet` | `fleet-table/*` |
| Filters | Toolbar | Narrow the book | `getFleet` input | `fleet-table/toolbar.tsx` |
| Detail | Drawer | Context on demand | `getReadings` | `device-drawer/*` |

### Code map

| Layer | File | What it does |
|---|---|---|
| Page | `src/app/(root)/(dashboard)/devices/fleet/page.tsx` | Prefetch + Suspense |
| Server prefetch | `src/features/devices/server/index.ts` | `batchPrefetchFleetTable` |
| Hook | `src/features/devices/hooks/use-get-fleet.ts` | Paged query |
| Component | `src/features/devices/components/fleet-table/*` | Table + toolbar |
| Router | `src/trpc/routers/devices.ts` | `getFleet` |
| Query | `src/db/queries/devices.ts` | Latest reading per dispenser |
| Seed | `src/db/seed/generators/dispensers.ts` | Device state |
| Seed | `src/db/seed/generators/readings.ts` | Latest telemetry |

### What to notice as a reviewer

1. The table does not ship the full reading history; it ships the latest reading per device.
2. Filters and pagination are server-side.
3. The same drawer is shared with `/devices`; no duplicate detail UI.

### Trade-offs & next

- No bulk actions.
- No CSV export.
- No device-level alert history.
- No column customization.

## Verification

- All three pages render.
- Every chart maps to a real query.
- Every code map row points to a real file.
- The pages use the same route template as prompt 05.
- `bun run build` passes.
