# Phase 5 - Revenue, Societies, Leads, Sustainability

> Read `prompt/00-master-plan.md` first (§7). Work in this repo; follow `AGENTS.md`.

## Goal

Ship the remaining four routes end-to-end, same server-prefetch → hooks → UI pattern.

## Feature folders

```
src/features/revenue/         src/features/societies/
src/features/leads/           src/features/sustainability/
```

## `/revenue` - Subscriptions & Billing

- **KPI row:** MRR, ARPU, active subs, failed % this month, collections rate 90d.
- **Charts:**
  - MRR trend 18 mo → `EChartsAreaChart`
  - Plan mix over time (stacked subs per plan) → `EChartsBarChart` stacked (or `EChartsComposedChart` if a total line adds clarity)
  - Payment status per month (paid/late/failed/pending) → `EChartsBarChart` stacked, semantic colors
- **Cohort retention matrix** (`getCohortRetention`): rows = join-month cohorts, columns = months since join; cells show % retained with heat shading (light → dark). Pure CSS/Table - not a chart. Cap columns at 12 for legibility with a "show more" toggle.
- **Overdue payments table** (`getOverdue`): household, billing month, amount, status badge, days late; row action **Mark paid** → `markPaid` mutation + toast + invalidate KPIs/trend/table.
- Empty/zero-safe: months with no payments must not produce NaN.

## `/societies` - Expansion & Penetration

- **KPI row:** societies, avg penetration %, flats covered, areas.
- **Charts:**
  - Cumulative households by area (top 8 areas + "Other") → `EChartsAreaChart` stacked
  - Penetration % by area → `EChartsBarChart` (sorted desc; tooltip shows infra age + tickets/100)
- **Society table** (`getList`): society, area, total flats, subscribed, penetration % (mini progress bar), onboarded date, open tickets, avg TDS 30d; search + area filter; server-paged; sortable.
- **Society drawer** (`getById`): per-plan counts, penetration, top-5 highest-risk households with links to `/customers`, open tickets count.

## `/leads` - Sales Funnel

- **KPI row:** total leads, visit rate, conversion rate, flats converted this quarter.
- **Charts:**
  - Funnel Leads → Visits → Converted as **horizontal `EChartsBarChart`** with %-of-leads labels (evilcharts has no funnel primitive - do not fake one; bars + labels read cleaner anyway)
  - Conversion by source → `EChartsBarChart` grouped (leads vs visits vs converted)
- **Leads table** (`getList`): name, society, role, source, visit date, converted badge, flats; source + converted filters; server-paged.
- **Actions:** **Add lead** dialog (`create`), row edit dialog: set/clear visit date, toggle converted + flatsConverted (`update`). Toast on all mutations.

## `/sustainability` - Impact

- **Tiles:** litres served (est.), 20L jars avoided, households served, months live.
- **Charts:**
  - Cumulative litres + jars avoided (24 mo) → `EChartsAreaChart` (two series; jars on secondary axis or a second chart - keep readable)
  - By plan → `EChartsBarChart` (litres per plan, jars as labels)
- **Method note card** (required for honesty): "Litres estimated from active subscription-days × plan daily litres (starter 8 / standard 12 / premium 18); 1 jar = 20L. Demo data." Format numbers with `Intl.NumberFormat` (Indian grouping, `en-IN`).

## Definition of done

- [ ] All four routes server-prefetched and rendering real data
- [ ] Revenue mark-paid flow toasts and invalidates; cohort matrix renders without NaN
- [ ] Society drawer links to the customers route correctly
- [ ] Leads create/update flows toast; funnel percentages add up
- [ ] Sustainability method note visible; numbers use `en-IN` formatting
- [ ] check-types / lint / build green; changes left uncommitted

## Gotchas

- Stacked chart colors: define a consistent palette in a shared feature util (plan colors reused on overview/revenue/sustainability).
- Keep each route's server page using `batchPrefetch` for all its queries (single batch round-trip).
