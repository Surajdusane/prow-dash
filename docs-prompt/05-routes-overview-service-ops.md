# Prompt 05 — Route index, Overview, Service Ops

Read `docs-prompt/00-readme.md` first.

## Goal

Write:

- `src/content/docs/routes/index.mdx` — how to read the route pages + full route map
- `src/content/docs/routes/overview.mdx` — `/`
- `src/content/docs/routes/service-ops.mdx` — `/service-ops`

This prompt also establishes the route-page template that prompts 06–08 will reuse.

## Route page template

Every route page follows this exact order:

```mdx
---
title: "/route — short label"
description: One sentence explaining the decision this page supports.
---

<RouteMeta
  live="/route"
  time="4 min"
  repoPath="src/app/(root)/(dashboard)/route/page.tsx"
/>

## Why this route exists
The business question and the decision it supports.

## What I chose — and what I left out
| Option | Why I rejected it | What I chose instead |
...

## What’s on screen

Describe the surface in prose: what the user sees, the decision it supports, and which query feeds it.

### Section name
**Visual:** chart type or UI pattern · **Why:** ...
**Data:** query function → tables
**Code:** <SourceLink ... />

## The data behind it
Seed logic, tables, windows, formulas.

## Chart → data → code
| Section | Visual | Why this visual | Data source | Component |
...

## Interactions
Mutations, optimistic updates, invalidation, toasts.

## Code map
| Layer | File | What it does |
...

## What to notice as a reviewer
3 specific clicks or files.

## Trade-offs & next
...
```

Use `<SourceLink>` for code. Use `Callout` for a reviewer note if useful.

## 1. `routes/index.mdx`

Frontmatter:

```yaml
---
title: Route by route
description: The nine dashboard routes, the decision each one supports, and how to verify the code behind it.
---
```

### Required sections

#### How to read these pages

- Each route page starts with the business question.
- Then the options considered and the chosen composition.
- Then the data/seed logic.
- Then a chart/data/code table.
- Then a code map and “what to notice”.
- Every page is self-contained; you can jump to the route you care about.

#### Route map

A table with one row per route:

| Route | Decision it supports | Main visuals | Primary query |
|---|---|---|---|
| `/` | Is the business healthy? | KPIs, billing trend, growth, plan mix, area health | `src/db/queries/overview.ts` |
| `/service-ops` | Who needs service next? | Kanban, predictive table, area demand, SLA, workload | `src/db/queries/service-ops.ts` |
| `/customers` | Who is about to churn? | Risk table, donut, complaint trend, drawer | `src/db/queries/customers.ts`, `risk.ts` |
| `/devices` | Which devices need attention? | Anomaly donut, telemetry trend, online gauge, feed | `src/db/queries/devices.ts` |
| `/devices/fleet` | What is the state of every dispenser? | Filterable table, drawer | `src/db/queries/devices.ts` |
| `/revenue` | Where is revenue leaking? | MRR, plan mix, payment outcomes, cohorts, overdue | `src/db/queries/revenue.ts` |
| `/societies` | Where should we expand? | Growth area, penetration bars, society table | `src/db/queries/societies.ts` |
| `/leads` | Is the funnel working? | Funnel, source conversion, leads table | `src/db/queries/leads.ts` |
| `/sustainability` | What impact can we claim? | Impact tiles, litres/jars trends, by-plan bar | `src/db/queries/impact.ts` |

Link each route to its docs page.

#### Chart selection rules

A short list that shows deliberate visual choices:

- Trend over time → area or line
- Category comparison → bar; horizontal when labels are long
- Part-to-whole at a point → donut
- Composition over time → stacked bar or stacked area
- Single percentage vs target → semi-radial gauge
- Ranking → sorted horizontal bar
- Cohort retention → matrix
- Action list → table + drawer

#### The shared anatomy

A small text flow or bullet list:

```text
Route page (server)
  → feature server prefetch
  → HydrateClient
  → Suspense + skeleton
  → client hook
  → chart/table/drawer
```

Link to `/docs/architecture/code-flow`.

#### Reviewer shortcuts

- Start with `/service-ops` and `/customers`.
- Then `/revenue` for cohort retention.
- Then `/devices` for telemetry.
- Then `/` for the executive summary.

## 2. `routes/overview.mdx` — `/`

Frontmatter:

```yaml
---
title: "/ — Executive overview"
description: The 60-second health check for the whole ProWater network.
---
```

### Why this route exists

- The first question an ops lead asks: *is the business healthy this month?*
- The page must answer it in under a minute: households, revenue, churn, open service load, fleet purity.
- It is also the entry point to every other route.

### What I chose — and what I left out

| Option | Why I rejected it | What I chose instead |
|---|---|---|
| A wall of every metric | No hierarchy; nothing stands out | Six KPIs + four supporting visuals |
| Only charts, no numbers | Slow to scan | KPI row first, then trends |
| A single revenue chart | Misses service and fleet health | Revenue + growth + plan mix + area health |
| A map of Bangalore | Interesting but not decision-ready | Area health table with TDS/SLA |

### What’s on screen

Live route: `/`.

#### KPI row

Six KPIs from `getOverviewKpis`:

- active households
- MRR
- 90-day churn %
- open tickets
- new this month
- 7-day average purity

Explain the denominator for churn: cancellations ÷ households active at the start of the window. Link to `src/db/queries/overview.ts`.

#### Billing trend

- **Visual:** area chart, billed vs collected, 18 months.
- **Why:** two series over time; the gap is the story.
- **Data:** `getRevenueTrend` → `getBillingTrend` → `payments`.
- **Component:** `src/features/overview/components/revenue-trend-card.tsx`.

#### Household growth

- **Visual:** area chart, cumulative active vs cancelled, 24 months.
- **Why:** shows growth and leakage on the same timeline.
- **Data:** `getHouseholdGrowth` → `households`.
- **Component:** `src/features/overview/components/household-growth-card.tsx`.

#### Plan mix

- **Visual:** donut, active subscriptions by plan.
- **Why:** three categories, part-to-whole; easy to read at a glance.
- **Data:** `getPlanMix` → `subscriptions` + `plans`.
- **Component:** `src/features/overview/components/plan-mix-card.tsx`.

#### Area health

- **Visual:** table: area, households, open tickets, 30-day avg TDS, 90-day SLA %.
- **Why:** multiple metrics per area; a table is better than five charts.
- **Data:** `getAreaHealth` → `areas`, `societies`, `households`, `service_tickets`, `readings`.
- **Component:** `src/features/overview/components/area-health-card.tsx`.

### The data behind it

- Seed: growth waves, plan-mix shift, payment statuses, area infrastructure age.
- Windows: 18 months billing, 24 months growth, 30 days TDS, 90 days SLA.
- The page is `force-dynamic`; data is rendered at request time.

### Chart → data → code

| Section | Visual | Why | Data source | Component |
|---|---|---|---|---|
| KPI row | KPI tiles | Fast scan | `getOverviewKpis` | `kpi-row.tsx` |
| Billing trend | Area | Two series over time | `getRevenueTrend` | `revenue-trend-card.tsx` |
| Household growth | Area | Cumulative trend | `getHouseholdGrowth` | `household-growth-card.tsx` |
| Plan mix | Donut | Part-to-whole, 3 categories | `getPlanMix` | `plan-mix-card.tsx` |
| Area health | Table | Multi-metric comparison | `getAreaHealth` | `area-health-card.tsx` |

### Interactions

- No mutations on the overview.
- Every card is a link or entry point to a deeper route.
- Suspense per section; skeletons shaped like the final content.

### Code map

| Layer | File | What it does |
|---|---|---|
| Page | `src/app/(root)/(dashboard)/page.tsx` | Prefetch + Suspense layout |
| Server prefetch | `src/features/overview/server/index.ts` | `batchPrefetchOverview` |
| Hooks | `src/features/overview/hooks/*` | Five suspense queries |
| Components | `src/features/overview/components/*` | KPI row + four cards |
| Router | `src/trpc/routers/overview.ts` | Five procedures |
| Queries | `src/db/queries/overview.ts` | KPI/trend/plan/area queries |
| Query | `src/db/queries/payments.ts` | `getBillingTrend` |
| Seed | `src/db/seed/generators/households.ts`, `payments.ts`, `societies.ts` | Growth/payment/area patterns |

### What to notice as a reviewer

1. The churn KPI is not “cancelled ÷ active”; it uses the active base at the start of the window. Read `getOverviewKpis`.
2. The area health table is a single query fan-out with `Promise.all`, not five round trips.
3. The page has no client-side fetch; every card is hydrated from the server prefetch.

### Trade-offs & next

- The KPI row is intentionally fixed; a configurable dashboard would be better for different roles.
- Billing trend stops at 18 months to keep the chart readable.
- No comparison to previous period; a delta indicator would help.
- Area health is a table; a map would be a nice addition but not required for the decision.

## 3. `routes/service-ops.mdx` — `/service-ops`

Frontmatter:

```yaml
---
title: "/service-ops — Field operations"
description: Triage the service board, see where demand is concentrated, and act before the next complaint.
---
```

### Why this route exists

- Service ops has two jobs: **triage today’s work** and **prevent tomorrow’s failures**.
- The page combines a kanban for action with a predictive queue for prevention.
- It also exposes the capacity story: area demand, SLA, technician load.

### What I chose — and what I left out

| Option | Why I rejected it | What I chose instead |
|---|---|---|
| Table with a status dropdown | Slower to triage; no spatial sense of flow | Four-column kanban with drag |
| Calendar view | Good for scheduling, not triage | Kanban + predictive table |
| Only the predictive list | No current work management | Kanban + predictive |
| A map of tickets | Interesting but not the first decision | Area demand bar + table |

### What’s on screen

Live route: `/service-ops`.

#### Kanban board

- **Visual:** four columns: New → Assigned → In progress → Resolved.
- **Why:** mirrors the ops workflow; dragging is the natural action.
- **Data:** `getBoard` → `service_tickets`, `households`, `technicians`, `areas`.
- **Interaction:** drag triggers an optimistic mutation; on error, the card returns and a toast explains.
- **Code:** `src/features/service-ops/components/board/*`, `use-update-ticket-status.ts`.

#### Predictive table

- **Visual:** ranked table with reason chips.
- **Why:** an action queue, not a chart.
- **Data:** `getPredictive` → `readings`, `dispensers`, `households`, `societies`, `areas`.
- **Code:** `src/features/service-ops/components/predictive-table.tsx`, `src/db/queries/service-ops.ts`.

#### Area demand

- **Visual:** grouped bar: tickets (90d) + tickets per 100 households.
- **Why:** compares volume and density across areas; the tooltip adds infrastructure age.
- **Data:** `getAreaDemand` → `service_tickets`, `households`, `societies`, `areas`.
- **Code:** `src/features/service-ops/components/area-demand-card.tsx`.

#### SLA performance

- **Visual:** semi-radial gauge.
- **Why:** one percentage against a target; the color changes with the band.
- **Data:** `getSlaStats` → `service_tickets`.
- **Code:** `src/features/service-ops/components/sla-gauge-card.tsx`.

#### Technician workload

- **Visual:** horizontal bar: open now vs resolved 30d.
- **Why:** long names; ranking by current queue.
- **Data:** `getTechnicianWorkload` → `service_tickets`, `technicians`, `areas`.
- **Code:** `src/features/service-ops/components/technician-workload-card.tsx`.

#### Create / assign / delete flows

- Create ticket dialog, assign ticket dialog, delete confirmation.
- Use toast for success/error and `ConfirmationDialog` for destructive actions.

### The data behind it

- Tickets are not random: `simulateDispenserLife` produces a TDS curve; repairs/filter changes are emitted when TDS crosses thresholds or the filter cycle ends.
- SLA targets: repair 48h, filter change 72h, inspection 96h, installation 120h.
- Technician load weights make one or two techs in high-stress areas absorb most of the volume.
- Area infrastructure age is the lever for demand concentration.

### Chart → data → code

| Section | Visual | Why | Data source | Component |
|---|---|---|---|---|
| Kanban | dnd-kit board | Workflow triage | `getBoard` | `board/*` |
| Predictive queue | Table | Action list | `getPredictive` | `predictive-table.tsx` |
| Area demand | Grouped bar | Compare volume + density | `getAreaDemand` | `area-demand-card.tsx` |
| SLA | Semi-radial | Single % vs target | `getSlaStats` | `sla-gauge-card.tsx` |
| Workload | Horizontal bar | Ranked capacity | `getTechnicianWorkload` | `technician-workload-card.tsx` |

### Interactions

- Drag card → optimistic status update → tRPC mutation → toast → invalidate board/KPIs.
- Create ticket → dialog → mutation → toast → invalidate board, predictive, area demand, SLA.
- Assign ticket → dialog → mutation → toast → invalidate workload.
- Delete ticket → confirmation → mutation → toast → invalidate.

Call out the optimistic update in `use-update-ticket-status.ts`: it snapshots the previous board, updates the cache, rolls back on error.

### Code map

| Layer | File | What it does |
|---|---|---|
| Page | `src/app/(root)/(dashboard)/service-ops/page.tsx` | Prefetch + Suspense layout |
| Server prefetch | `src/features/service-ops/server/index.ts` | `batchPrefetchServiceOps` |
| Hooks | `src/features/service-ops/hooks/*` | Board, predictive, area, SLA, workload |
| Components | `src/features/service-ops/components/*` | Board, tables, charts, dialogs |
| Router | `src/trpc/routers/service-ops.ts` | Procedures |
| Query | `src/db/queries/service-ops.ts` | `getPredictive`, `getAreaDemand`, `getSlaStats`, `getTechnicianWorkload` |
| Query | `src/db/queries/tickets.ts` | Board + ticket mutations |
| Seed | `src/db/seed/generators/readings.ts` | TDS/filter timeline |
| Seed | `src/db/seed/generators/tickets.ts` | Causal tickets + SLA |
| Seed | `src/db/seed/reference.ts` | Technician load weights |

### What to notice as a reviewer

1. Drag a card and watch the optimistic update; refresh to confirm it persisted.
2. Compare the predictive table’s top rows with the area demand chart; the high-stress areas should line up.
3. Read `getPredictive`; the SQL window function and TS slope are the whole model.

### Trade-offs & next

- The kanban is a triage surface, not a full dispatch optimiser.
- No route optimisation or calendar capacity planning.
- The predictive queue is batch, not streaming.
- No technician availability/shift model.
- The board is shared by all demo visitors; no auth.

## Verification

- All three pages render.
- Route links work.
- Code links resolve.
- The route template is consistent and ready for prompts 06–08.
- `bun run build` passes.
