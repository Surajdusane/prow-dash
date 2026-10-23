# Phase 4 - Customers (`/customers`) + Devices (`/devices`)

> Read `prompt/00-master-plan.md` first (§7). Work in this repo; follow `AGENTS.md`.

## Goal

Ship the churn/risk module and the IoT fleet monitoring route end-to-end, same server-prefetch → hooks → UI pattern as Phase 3.

## Feature folders

```
src/features/customers/{components,hooks,server,index.ts}
src/features/devices/{components,hooks,server,index.ts}
```

## `/customers` - Churn & Risk

- **KPI row:** active households, high-risk count (riskScore ≥ 67), churned last 90d, avg tenure.
- **Risk table** (`getRiskTable`): columns - household (flat + resident), society/area, plan, tenure, **risk score** (badge/bar, color: low green / medium amber / high red), complaints 90d, late+failed payments 6mo, last complaint date, status. Server-paged (25/page, `Pagination` component), sortable headers (map to `sort`/`dir` input), filters: risk band, area, status. URL state optional (nuqs not installed - keep local state or search params via `useSearchParams`).
- **Charts:**
  - Risk distribution → `EChartsPieChart` donut (3 bands)
  - Complaint trend 12 mo by category → `EChartsLineChart` multi-series
- **Household drawer** (`getById`, open from row click):
  - Header: name, flat, society/area, status badge, risk score ring.
  - Sections: subscription + plan, dispenser status, TDS/purity sparkline (last 30d readings, tiny `EChartsLineChart` or sparkline), tickets list, complaints list (resolve action), payments list (status chips).
  - Actions: **Add complaint** dialog (`createComplaint`), **Resolve** complaint (`resolveComplaint`), **Recompute risk** button - global recompute with `confirm()` from `use-confirm`, then `recomputeRisk` mutation + toast + invalidate risk table/distribution.
- All mutations toast success/error; empty states for household history sections.

## `/devices` - IoT Fleet

- **KPI row:** online %, avg purity 7d, needs service count (filter age > 75d or TDS > 450), offline > 7d count, fleet online gauge (`EChartsRadialChart`).
- **Fleet table** (`getFleet`): dispenser id, household, society/area, type badge, online dot, last reading (relative time), latest TDS / pH / purity (flag colors), filter age days, flag badge (ok / rising TDS / offline). Filters: area, type, online; server-paged.
- **Device detail** (row click → drawer or split section):
  - `getReadings({ dispenserId, days })` with a 30/90-day `Tabs` toggle.
  - Chart → `EChartsComposedChart`: TDS line (left axis) + purity line (right axis); mark the filter-change reset visually via tooltip data (readings only - no annotation API; keep tooltip informative).
  - Meta: household, install date, last filter change, status.
- **Anomaly panel** (`getAnomalies`): severity-sorted list (TDS > 450, purity < 85%, offline > 7d) with "View device" jump and "Create ticket" shortcut (dispatch to service-ops `createTicket` mutation, then toast + invalidate).

## Definition of done

- [ ] Risk table sorts/filters/pages server-side; risk badges match seed cohort (known churners rank high)
- [ ] Recompute visibly reorders the table after mutation
- [ ] Complaint add/resolve flows toast and invalidate
- [ ] Device readings chart toggles 30/90d without refetch jank; anomaly list deep-links to the device
- [ ] Read-only route (`/devices`) has no mutations except the ticket shortcut
- [ ] check-types / lint / build green; changes left uncommitted

## Gotchas

- Risk table row → drawer should not refetch the whole table; `getById` is its own query.
- Keep the sparkline honest: cap to ≤ 30 points.
- Relative timestamps: write a tiny `formatRelativeTime` util in the feature's `utils/`.
