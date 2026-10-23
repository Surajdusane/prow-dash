# Phase 3 - Overview (`/`) + Service Ops (`/service-ops`)

> Read `prompt/00-master-plan.md` first (§7). Work in this repo; follow `AGENTS.md`.

## Goal

Ship the first two routes end-to-end: server prefetch → HydrateClient → hooks → charts/tables, plus the dnd-kit Kanban board on Service Ops.

## Feature folders

```
src/features/overview/{components,hooks,server,index.ts}
src/features/service-ops/{components,hooks,server,index.ts}
```

Pattern for both routes:

- `features/<f>/server/index.ts`: `prefetchX()` wrappers using `prefetch` from `@/trpc/server` (one per procedure, or a `batchPrefetchOverview()`).
- `features/<f>/hooks/*`: one hook per procedure (`useSuspenseQuery`) + mutations (`useMutation` + `toastManager` on success/error + `queryClient.invalidateQueries`).
- Server page: `export const dynamic = "force-dynamic"` → `batchPrefetch([...])` → `<HydrateClient><ErrorBoundary fallback={…}><Suspense fallback={Skeletons}><ClientSections /></Suspense></ErrorBoundary></HydrateClient>`.
- Client components never fetch directly - only hooks.

## `/` Overview

- **KPI row** (`KpiCard` from Phase 0): active households, MRR, 90-day churn rate, open tickets, new this month, avg purity 7d. Show skeleton cards while suspended.
- **Charts** (fixed-height containers, evilcharts):
  - Billing/revenue trend 18 mo → `EChartsAreaChart` (billed vs collected series)
  - Household growth (cumulative active + cancelled) → `EChartsAreaChart`
  - Plan mix → `EChartsPieChart` donut
- **Area health strip** → `Table` with area, households, open tickets, avg TDS, SLA %, mini progress bar for SLA.

## `/service-ops`

- **KPI row:** open tickets, overdue >7d, avg resolution days, SLA met % (gauge visual optional).
- **Charts:**
  - Area demand → `EChartsBarChart` grouped: tickets 90d + tickets per 100 households (secondary axis), tooltip shows infra age
  - Technician workload → `EChartsBarChart` (open vs resolved 30d per tech)
  - SLA met % → `EChartsRadialChart` gauge
- **Kanban board (dnd-kit):**
  - Columns: New (open, unassigned) → Assigned (open + technician) → In Progress → Resolved (last 30d).
  - `DndContext` + one `SortableContext` per column, `useSortable` cards, `DragOverlay` for the floating card, `PointerSensor` + `KeyboardSensor` (a11y bonus).
  - Drop → optimistic mutation: `updateStatus` (column change) and/or `assign` (moving out of New needs a technician - open a small assign popover/select when dropping into Assigned without one).
  - Optimistic pattern: `onMutate` cancel queries + snapshot + `setQueryData`; `onError` rollback + error toast; `onSettled` invalidate. Success toast on drop.
  - Card: flat + society, area, ticket type badge, technician avatar initials, raised date, SLA countdown/overdue badge. Column header: count + filter (type/area/search) from `getBoard` input.
- **Predicted next service table** (top 25 from `getPredictive`): household, area, filter age, latest TDS, slope, reason. Badge color by urgency; "Create ticket" row action pre-filling the create dialog.
- **Dialogs/drawer:**
  - Create ticket dialog (household picker from `getHouseholdsLite` + `Combobox`, type select) → `createTicket`.
  - Ticket drawer (click card): details + assign technician select + resolve button + delete (via `confirm()` from `use-confirm`).
  - All mutations: success/error toasts; disable buttons while pending (`Spinner`).

## Definition of done

- [ ] Both routes fully server-prefetched; no client-side direct fetching
- [ ] Charts render from real seeded data inside fixed-height containers
- [ ] Kanban drag persists across refresh; optimistic rollback works (test by dropping with network throttled)
- [ ] Create/assign/resolve/delete flows all toast correctly; delete asks confirmation
- [ ] Predicted-service list surfaces genuinely dripping dispensers (cross-check with seed)
- [ ] check-types / lint / build green; changes left uncommitted

## Gotchas

- Charts are client components - keep them in leaf components fed by props from hook-powered parents.
- Keep chart containers `h-[280px]`+ fixed; evilcharts needs a sized parent.
- Don't over-fetch the board: resolved column capped at 30 days on the server.
