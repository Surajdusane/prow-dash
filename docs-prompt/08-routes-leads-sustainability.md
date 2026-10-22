# Prompt 08 — Leads and Sustainability

Read `docs-prompt/00-readme.md` first, then reuse the route-page template from `docs-prompt/05-routes-overview-service-ops.md`.

## Goal

Write:

- `src/content/docs/routes/leads.mdx`
- `src/content/docs/routes/sustainability.mdx`

These are the two “growth and impact” routes. They are less operational than Service Ops or Customers, but they show a different kind of product thinking: a working sales funnel and a defensible impact estimate.

## 1. `routes/leads.mdx` — `/leads`

Frontmatter:

```yaml
---
title: "/leads — Sales funnel"
description: Enquiry volume, site visits and conversions by channel — a working top-of-funnel with create and update flows.
---
```

### Why this route exists

- Growth is not only retention. The business needs new societies and households.
- The sales team needs to know:
  - how many leads are coming in
  - which channels produce visits
  - which channels actually convert
  - which leads need a follow-up
- The page answers: *is the funnel working, and where is it leaking?*

### What I chose — and what I left out

| Option | Why I rejected it | What I chose instead |
|---|---|---|
| A single lead count | No funnel or channel insight | Funnel + source conversion + table |
| A CRM-style pipeline board | Overkill for the question; leads are not tickets | Funnel + table |
| A pie chart of sources | Part-to-whole hides conversion | Grouped bars with leads/visits/converted |
| Read-only table | The demo should prove mutations | Create/update lead dialogs |
| Forecast / attribution model | Not enough data; would be fake precision | Observed counts and rates only |

### What’s on screen

Live route: `/leads`.

#### KPI row

Fields from `getLeadsKpis`:

- `totalLeads`
- `visitRate`
- `conversionRate`
- `flatsConvertedQtd`

Explain the denominator: all rates are relative to total leads, not to the previous stage. That is deliberate: the funnel chart shows stage-to-stage volume, while the KPI row shows overall efficiency.

#### Pipeline funnel

- **Visual:** horizontal bar, one bar per stage: leads → visits → converted, with `% of leads` labels.
- **Why:** a funnel is a stage comparison; horizontal bars keep the stage labels readable and let each bar carry its own stage color and value label.
- **Data:** `getLeadFunnel` → `leads`.
- **Implementation detail:** this uses a custom ECharts series because the stock bar series cannot give each bar its own color and value label. The component notes that ECharts cannot resolve CSS variables inside canvas overrides, so the hex colors are chosen per theme.
- **Component:** `src/features/leads/components/funnel-card.tsx`.

#### Conversion by source

- **Visual:** grouped bar, one group per source, three bars: `leads`, `visits`, `converted`.
- **Why:** the channel comparison is the decision; grouping the three stages side by side shows both volume and conversion.
- **Data:** `getLeadsBySource` → `leads`.
- **Component:** `src/features/leads/components/source-conversion-card.tsx`.

#### Leads table

- **Visual:** server-paged table with source and converted filters.
- **Columns:** name, society, role, source, visit date, converted, flats converted, created.
- **Why:** the charts show the pattern; the table is the follow-up list.
- **Data:** `getList` → `leads`.
- **Component:** `src/features/leads/components/leads-table/*`.

#### Create / update lead

- **Visual:** dialog with validated fields.
- **Why:** proves the write path, not just read-only charts.
- **Mutations:** `create` and `update` → `createLead` / `updateLead`.
- **Validation:** Zod schemas in `src/trpc/schema`.
- **Components:** `create-lead-dialog.tsx`, `edit-lead-dialog.tsx`, `create-lead-button.tsx`, `dialogs.tsx`.

### The data behind it

- 450 leads over 24 months, skewed toward recent months (the pipeline is growing).
- Sources and weights: Instagram 32, referral 22, Google 20, walk-in 13, broker 13.
- ~40% of leads book a site visit.
- ~22% of visitors convert; a converted lead brings 1–5 flats (RWA-level deals).
- Roles: resident 45, RWA secretary 20, builder 20, other 15.
- 80% of leads are associated with a society; the rest are unassigned.

### Chart → data → code

| Section | Visual | Why | Data source | Component |
|---|---|---|---|---|
| KPI row | KPI tiles | Fast scan | `getLeadsKpis` | `kpi-row.tsx` |
| Funnel | Horizontal bar | Stage comparison | `getLeadFunnel` | `funnel-card.tsx` |
| Source conversion | Grouped bar | Volume + conversion by channel | `getLeadsBySource` | `source-conversion-card.tsx` |
| Leads table | Table + filters | Follow-up list | `getList` | `leads-table/*` |
| Create/update | Dialogs | Prove the write path | `create` / `update` | `dialogs.tsx` |

### Interactions

- Create lead → mutation → toast → invalidate KPIs, funnel, source conversion, and table.
- Update lead → mutation → toast → invalidate the same queries.
- Table filters and pagination are server-side.
- If a mutation fails, the dialog stays open, the error is shown in a toast, and the form state is preserved.

### Code map

| Layer | File | What it does |
|---|---|---|
| Page | `src/app/(root)/(dashboard)/leads/page.tsx` | Prefetch + Suspense |
| Server prefetch | `src/features/leads/server/index.ts` | `batchPrefetchLeads` |
| Hooks | `src/features/leads/hooks/*` | KPIs, funnel, source, list, create, update |
| Components | `src/features/leads/components/*` | KPI row, two charts, table, dialogs |
| Router | `src/trpc/routers/leads.ts` | Procedures |
| Query | `src/db/queries/leads.ts` | KPIs, funnel, source, list |
| Query | `src/db/queries/leads-mutations.ts` | Create / update |
| Seed | `src/db/seed/generators/leads.ts` | Funnel probabilities + source mix |

### What to notice as a reviewer

1. The funnel bars carry their own stage colors and `% of leads` labels; the stock bar series could not do that.
2. Source conversion is grouped, not stacked, because the three stages are not parts of a whole.
3. Create a lead and watch all four queries invalidate together.

### Trade-offs & next

- 450 leads is enough to show a funnel, not enough for statistical significance by channel.
- No lead scoring or assignment.
- No activity history or follow-up reminders.
- Conversion is binary; there is no “qualified” stage.
- The source list is a fixed enum in the seed, not a database table.

## 2. `routes/sustainability.mdx` — `/sustainability`

Frontmatter:

```yaml
---
title: "/sustainability — Impact estimate"
description: Litres served and 20 L jars avoided, estimated from subscription-days and plan usage — with the method stated.
---
```

### Why this route exists

- A water subscription has a credible environmental story: piped RO displaces single-use 20 L jars.
- The claim must be **defensible**. A vague “we saved the planet” number is worse than no page.
- The page answers: *how much water did we serve, and how many jars did that displace?*
- It also shows how to present an estimate honestly: formula, assumptions, and a method note.

### What I chose — and what I left out

| Option | Why I rejected it | What I chose instead |
|---|---|---|
| A single “jars saved” hero number | No audit trail | Tiles + formula + method note |
| Real-time IoT litres | The data is simulated; would overclaim | Subscription-days × plan litres/day |
| A map of impact | Doesn’t add to the decision | Cumulative trends + by-plan bar |
| Carbon / energy claims | Not modeled; would be invented | Water and jars only |
| A forecast | Too uncertain | Historical estimate only |

### What’s on screen

Live route: `/sustainability`.

#### Impact tiles

Fields from `getImpactTotals`:

- `litresServed`
- `jarsAvoided`
- `householdsServed`
- `monthsLive`

Explain that these are **estimates**, not meter readings.

#### Cumulative litres served

- **Visual:** area chart, cumulative litres by month, 24 months.
- **Why:** cumulative impact is a stock, not a flow; an area chart reads as “build-up over time.”
- **Data:** `getImpactMonthlyTrend` → `subscriptions` + `plans`.
- **Component:** `src/features/sustainability/components/litres-trend-card.tsx`.

#### Cumulative jars avoided

- **Visual:** area chart, cumulative 20 L jars displaced.
- **Why:** the same story in the unit a customer or investor can picture. The two charts are deliberately parallel.
- **Data:** same query; `jars = litres ÷ 20`.
- **Component:** `src/features/sustainability/components/jars-trend-card.tsx`.

#### Impact by plan

- **Visual:** vertical bar, all-time litres per plan.
- **Why:** three categories; the plan is the natural driver of usage (8 / 12 / 18 L per day).
- **Data:** `getImpactByPlan` → `subscriptions` + `plans`.
- **Component:** `src/features/sustainability/components/by-plan-card.tsx`.

#### Method note

- **Visual:** a card with the formula and assumptions.
- **Why:** the number is only credible if the method is visible.
- **Content:**
  - active days = days between subscription start and end (or today)
  - litres = active days × plan litres/day
  - starter 8 L/day, standard 12 L/day, premium 18 L/day
  - jars avoided = litres ÷ 20
  - excludes dispenser flushing, reject water, and delivery losses
- **Component:** `src/features/sustainability/components/method-note-card.tsx`.

### The data behind it

- Subscription spans are the source of truth, not a separate impact table.
- The same spans power revenue, retention, and impact, so the numbers are internally consistent.
- The plan constants live in `src/db/queries/plans.ts`:
  - `PLAN_LITRES_PER_DAY`
  - `JAR_SIZE_LITRES = 20`
- The estimate is conservative: it does not count water used for flushing or the reject stream from RO purification.

### Chart → data → code

| Section | Visual | Why | Data source | Component |
|---|---|---|---|---|
| Impact tiles | KPI tiles | Fast scan + method | `getImpactTotals` | `tiles.tsx` |
| Cumulative litres | Area | Build-up over time | `getImpactMonthlyTrend` | `litres-trend-card.tsx` |
| Cumulative jars | Area | Same story, human unit | `getImpactMonthlyTrend` | `jars-trend-card.tsx` |
| By plan | Bar | Three categories | `getImpactByPlan` | `by-plan-card.tsx` |
| Method | Note card | Audit trail | static copy | `method-note-card.tsx` |

### Interactions

- Read-only. The page is a reporting surface.
- No filters; the dataset is small enough that 24 months is the right default.

### Code map

| Layer | File | What it does |
|---|---|---|
| Page | `src/app/(root)/(dashboard)/sustainability/page.tsx` | Prefetch + Suspense |
| Server prefetch | `src/features/sustainability/server/index.ts` | `batchPrefetchSustainability` |
| Hooks | `src/features/sustainability/hooks/*` | Totals, trend, by plan |
| Components | `src/features/sustainability/components/*` | Tiles, two trend cards, by-plan, method note |
| Router | `src/trpc/routers/impact.ts` | Procedures |
| Query | `src/db/queries/impact.ts` | Totals, trend, by plan |
| Query | `src/db/queries/plans.ts` | Litres/day + jar size |
| Seed | `src/db/seed/generators/households.ts` | Subscription spans |
| Seed | `src/db/seed/reference.ts` | Plan usage constants |

### What to notice as a reviewer

1. The page never claims meter-level accuracy; the method note states the formula and exclusions.
2. The jars chart is exactly litres ÷ 20; there is no separate “jars” dataset to drift.
3. The by-plan chart is a bar, not a pie, because the three plans have very different volumes and the ranking is the point.

### Trade-offs & next

- Litres/day is a plan constant, not measured consumption.
- The estimate excludes reject water and flushing, so it is conservative on displacement but not a full lifecycle analysis.
- No carbon or energy claims.
- No per-society or per-area impact view.
- No third-party verification.

## Verification

- Both pages render.
- Every chart maps to a real query.
- The method note matches `PLAN_LITRES_PER_DAY` and `JAR_SIZE_LITRES`.
- Code links resolve.
- `bun run build` passes.

Do not commit.
