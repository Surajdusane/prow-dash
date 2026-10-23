# Prompt 07 - Revenue and Societies

Read `docs-prompt/00-readme.md` first, then reuse the route-page template from `docs-prompt/05-routes-overview-service-ops.md`.

## Goal

Write:

- `src/content/docs/routes/revenue.mdx`
- `src/content/docs/routes/societies.mdx`

Both pages must explain the business decision, the options considered, the chart choices, the seed/data logic, the interactions, and the exact code path. Every chart must map to a real query and component.

## 1. `routes/revenue.mdx` - `/revenue`

Frontmatter:

```yaml
---
title: "/revenue - Revenue and retention"
description: MRR, plan mix, payment outcomes and cohort retention - where revenue is leaking and which cohorts stick.
---
```

### Why this route exists

- Revenue is not one number. The ops lead needs to see:
  - **growth** - is MRR rising?
  - **mix** - are customers moving up-plan or down-plan?
  - **leakage** - how much is late, failed, or pending?
  - **retention** - do newer cohorts stick as well as older ones?
  - **action** - which overdue payments can be recovered now?
- The page answers: *where is revenue leaking, and which cohort is weak?*

### What I chose - and what I left out

| Option | Why I rejected it | What I chose instead |
|---|---|---|
| One revenue chart | Doesn’t show mix or leakage | Five surfaces: MRR, plan mix, payment outcomes, cohorts, overdue |
| Revenue by area | Interesting, but not the primary revenue decision | MRR + plan mix first |
| A single “churn” number | Hides cohort differences | Cohort retention matrix |
| A payments table only | No trend or mix | Stacked payment outcomes + overdue table |
| ARR / forecast | Not enough history to make a forecast honest | MRR only, with a clear label |

### What’s on screen

Live route: `/revenue`.

#### KPI row

Fields from `getRevenueKpis`:

- `mrr`
- `arpu`
- `activeSubs`
- `failedPctThisMonth`
- `collectionsRate90d`

Explain each:

- **MRR** - sum of active plan prices. It is not cash collected.
- **ARPU** - MRR ÷ active subscriptions.
- **Active subs** - current active subscription count.
- **Failed % this month** - failed payments ÷ all payments billed this month.
- **Collections rate (90d)** - collected ÷ billed over the last three billing months. This is the “are we actually getting paid?” number.

#### MRR trend

- **Visual:** area chart, one series, 18 month-ends.
- **Why:** a single trend line is the clearest way to show growth; the area fill gives it weight without adding a second axis.
- **Data:** `getMrrTrend` → `subscriptions` + `plans`.
- **Implementation detail:** MRR is reconstructed from subscription `startDate` / `endDate` at each month-end. There is no snapshot table.
- **Component:** `src/features/revenue/components/mrr-trend-card.tsx`.

#### Plan mix over time

- **Visual:** stacked bar, month-end active subscriptions by `starter`, `standard`, `premium`.
- **Why:** composition over time; a stacked bar makes the mix shift obvious.
- **Data:** `getPlanMixTrend` → `subscriptions` + `plans`.
- **Component:** `src/features/revenue/components/plan-mix-trend-card.tsx`.

#### Payment outcomes

- **Visual:** stacked bar by billing month: `paid`, `late`, `failed`, `pending`.
- **Why:** four outcomes per month; stacked counts show both volume and composition.
- **Data:** `getPaymentStatusByMonth` → `payments`.
- **Component:** `src/features/revenue/components/payment-status-card.tsx`.

#### Cohort retention

- **Visual:** matrix, join-month cohort × months since joining, heat-shaded percentages.
- **Why:** a matrix is the right shape for cohort × time. A line chart would collapse the cohort dimension.
- **Data:** `getCohortRetention` → `subscriptions` + `households`.
- **Behavior:** first 7 months visible, expandable to 12; cells before a cohort existed show a dot, not a fake 0%.
- **Component:** `src/features/revenue/components/cohort-retention-card.tsx`.

#### Overdue / failed payments

- **Visual:** server-paged table with one-click “Mark paid”.
- **Why:** this is an action list; the team needs to recover specific payments.
- **Data:** `getOverdue` → `payments`, `households`, `societies`, `areas`, `plans`.
- **Mutation:** `markPaid` → `markPaymentPaid`.
- **Component:** `src/features/revenue/components/overdue-table/*`.

### The data behind it

- Payments are generated per active subscription-month from `startDate` to `endDate` or today.
- Normal months: 88% paid, 8% late, 4% failed.
- Current month: 58% paid, 5% late, 4% failed, 33% pending.
- Risk-cohort months: 20% paid, 50% late, 30% failed - and the bad window starts one month before the complaint cluster.
- Plan prices: starter ₹499, standard ₹799, premium ₹1,199.
- MRR and impact are reconstructed from subscription spans, so there is one source of truth for “who was active when.”

### Chart → data → code

| Section | Visual | Why | Data source | Component |
|---|---|---|---|---|
| KPI row | KPI tiles | Fast scan | `getRevenueKpis` | `kpi-row.tsx` |
| MRR trend | Area | Single trend over time | `getMrrTrend` | `mrr-trend-card.tsx` |
| Plan mix | Stacked bar | Composition over time | `getPlanMixTrend` | `plan-mix-trend-card.tsx` |
| Payment outcomes | Stacked bar | Four outcomes per month | `getPaymentStatusByMonth` | `payment-status-card.tsx` |
| Cohort retention | Matrix | Cohort × time | `getCohortRetention` | `cohort-retention-card.tsx` |
| Overdue | Table + action | Recover specific payments | `getOverdue` | `overdue-table/*` |

### Interactions

- “Mark paid” → optimistic or pending state → `markPaid` mutation → toast → invalidate `getKpis`, `getPaymentStatusByMonth`, `getOverdue`.
- Table filters and pagination are server-side.
- If the mutation fails, the row must return to its previous state and the toast must explain why.

### Code map

| Layer | File | What it does |
|---|---|---|
| Page | `src/app/(root)/(dashboard)/revenue/page.tsx` | Prefetch + Suspense layout |
| Server prefetch | `src/features/revenue/server/index.ts` | `batchPrefetchRevenue` |
| Hooks | `src/features/revenue/hooks/*` | KPIs, MRR, plan mix, payment status, cohorts, overdue, mark paid |
| Components | `src/features/revenue/components/*` | KPI row, four cards, overdue table |
| Router | `src/trpc/routers/revenue.ts` | Procedures |
| Query | `src/db/queries/revenue.ts` | KPIs, MRR, plan mix, cohorts |
| Query | `src/db/queries/payments.ts` | Payment status, overdue, mark paid |
| Query | `src/db/queries/plans.ts` | Plan prices / plan type |
| Seed | `src/db/seed/generators/payments.ts` | Payment outcomes + risk-cohort drift |
| Seed | `src/db/seed/generators/households.ts` | Plan mix shift + cancellations |

### What to notice as a reviewer

1. MRR is reconstructed from subscription spans, not stored as a monthly snapshot. Read `getMrrTrend`.
2. The cohort matrix does not fake zeroes for months a cohort did not exist; it shows a dot.
3. Mark an overdue payment paid and watch the KPI row, payment outcomes, and table invalidate together.

### Trade-offs & next

- MRR is a point-in-time reconstruction; it ignores upgrades/downgrades within a month.
- Collections rate is a 90-day window, not a full ledger reconciliation.
- No dunning workflow or retry scheduling.
- No revenue forecast; the history is too short to make one honest.
- No per-area revenue view yet.

## 2. `routes/societies.mdx` - `/societies`

Frontmatter:

```yaml
---
title: "/societies - Expansion and penetration"
description: Where the society book is growing, which areas are under-penetrated, and which societies need attention.
---
```

### Why this route exists

- Growth depends on **where** the next society is, not just how many households exist.
- The team needs to compare areas by:
  - active households
  - penetration against flats covered
  - open tickets
  - average TDS
- The page answers: *where should we expand, and which society is underperforming?*

### What I chose - and what I left out

| Option | Why I rejected it | What I chose instead |
|---|---|---|
| A map of Bangalore | Nice visual, weak comparison | Stacked growth + penetration bars + table |
| One growth line | Hides area mix | Stacked area by area |
| A penetration donut | Part-to-whole doesn’t fit 8 areas | Horizontal bar, sorted |
| Cards per society | 50 cards is not scannable | Server-paged table + drawer |
| A separate society detail page | Slower context switching | Drawer with plan mix + top risk |

### What’s on screen

Live route: `/societies`.

#### KPI row

Fields from `getSocietiesKpis`:

- `societies`
- `avgPenetration`
- `flatsCovered`
- `areas`

#### Onboarding growth

- **Visual:** stacked area, cumulative active households per area, 24 months, top 8 areas + “Other”.
- **Why:** growth is cumulative and compositional; a stacked area shows both the total and which areas drive it.
- **Data:** `getGrowthTrend` → `households`, `societies`, `areas`.
- **Detail:** series keys come from the data, not a hardcoded area list, so a new area is not silently dropped.
- **Component:** `src/features/societies/components/growth-trend-card.tsx`.

#### Penetration by area

- **Visual:** horizontal bar, active households ÷ flats covered, sorted highest first.
- **Why:** eight area names are long; horizontal bars keep labels readable. Sorting turns it into a ranking.
- **Data:** `getAreaPenetration` → `societies`, `households`, `service_tickets`.
- **Tooltip:** infrastructure age and tickets per 100 households add the “why” behind the number.
- **Component:** `src/features/societies/components/area-penetration-card.tsx`.

#### Society table

- **Visual:** server-paged table with area filter and sort.
- **Columns:** society, area, flats, subscribed, penetration %, open tickets, 30-day avg TDS, onboarded.
- **Why:** the table is the lookup/comparison surface; charts show the pattern, the table finds the specific society.
- **Data:** `getSocietyList` → `societies`, `households`, `service_tickets`, `readings`, `areas`.
- **Component:** `src/features/societies/components/society-table/*`.

#### Society drawer

- **Visual:** drawer with society facts, plan breakdown, top-risk households.
- **Why:** the row answers “what is this society?”; the drawer answers “who inside it needs attention?”
- **Data:** `getSocietyDetail` → `societies`, `households`, `subscriptions`, `plans`, `service_tickets`, `readings`.
- **Component:** `src/features/societies/components/society-drawer/*`.

### The data behind it

- 50 societies across 8 areas; area allocation is weighted toward high-infrastructure areas.
- Onboarding waves over the first 14 months, starting slow, peaking mid-year one, then tapering.
- Each society has 80–400 flats; households join shortly after onboarding, with a recent-joiner slice.
- Penetration is active households ÷ total flats covered, not total flats in Bangalore.
- Top-risk households in the drawer come from the same risk score as `/customers`.

### Chart → data → code

| Section | Visual | Why | Data source | Component |
|---|---|---|---|---|
| KPI row | KPI tiles | Fast scan | `getSocietiesKpis` | `kpi-row.tsx` |
| Growth | Stacked area | Total + area mix over time | `getGrowthTrend` | `growth-trend-card.tsx` |
| Penetration | Horizontal bar | Ranked comparison, long labels | `getAreaPenetration` | `area-penetration-card.tsx` |
| Society book | Table | Lookup + comparison | `getSocietyList` | `society-table/*` |
| Society detail | Drawer | Context on demand | `getSocietyDetail` | `society-drawer/*` |

### Interactions

- Area filter and sort are server-side.
- Selecting a society opens the drawer; the table state is preserved.
- The drawer is read-only; the next action is a link to the households/risk flow.

### Code map

| Layer | File | What it does |
|---|---|---|
| Page | `src/app/(root)/(dashboard)/societies/page.tsx` | Prefetch + Suspense |
| Server prefetch | `src/features/societies/server/index.ts` | `batchPrefetchSocieties` |
| Hooks | `src/features/societies/hooks/*` | KPIs, growth, penetration, list, detail |
| Components | `src/features/societies/components/*` | KPI row, two cards, table, drawer |
| Router | `src/trpc/routers/societies.ts` | Procedures |
| Query | `src/db/queries/societies.ts` | KPIs, list, growth, penetration, detail |
| Seed | `src/db/seed/generators/societies.ts` | Onboarding waves + flat counts |
| Seed | `src/db/seed/generators/households.ts` | Household join curve |
| Seed | `src/db/seed/reference.ts` | Area infrastructure ages |

### What to notice as a reviewer

1. The growth chart’s series are data-driven; open `growthSeriesKeys` and the component to see how a new area is handled.
2. Penetration is sorted by percentage, but the tooltip adds infrastructure age and tickets per 100 - the “why” behind the ranking.
3. Open a society with high penetration and low open tickets; the drawer should show a healthy plan mix and few top-risk households.

### Trade-offs & next

- Penetration uses flats covered by onboarded societies, not all flats in an area.
- No map view; the table and bars are better for comparison, but a map would help field planning.
- No lease/contract data per society.
- No expansion scoring model; the page gives inputs, not a recommendation.
- The drawer is read-only.

## Verification

- Both pages render.
- Every chart maps to a real query and component.
- Code links resolve.
- The pages use the route template consistently.
- `bun run build` passes.

Do not commit.
