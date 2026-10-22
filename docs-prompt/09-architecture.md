# Prompt 09 — Architecture pages

Read `docs-prompt/00-readme.md` first.

## Goal

Write four pages that explain how the system is put together and how a request moves through it:

- `src/content/docs/architecture/system.mdx`
- `src/content/docs/architecture/data-model.mdx`
- `src/content/docs/architecture/api.mdx`
- `src/content/docs/architecture/code-flow.mdx`

These pages should make a technical interviewer want to open the repo. They should be concrete, not architectural poetry.

## Shared rules

- Start with the problem, not the stack.
- Every technical claim gets a `<SourceLink>`.
- State trade-offs explicitly.
- Do not claim auth, multi-tenancy, real-time streaming, or microservices. The app is a single Next.js deployment with a public demo.

## 1. `architecture/system.mdx`

Frontmatter:

```yaml
---
title: System architecture
description: One Next.js deployment, a typed tRPC boundary, Drizzle queries, and Neon Postgres — and why that was the right size for this project.
---
```

### Required sections

#### The shape of the problem

- A small ops product with:
  - 9 read-heavy dashboard routes
  - a handful of mutations (kanban, complaints, payments, leads, risk recompute)
  - one database
  - one deployable
- The important constraint is not scale; it is **iteration speed with end-to-end type safety**.
- A separate API service would add deployment and contract overhead without solving a real problem at this size.

#### The architecture

Explain the architecture in words:

```text
Browser
  → React 19 client components
  → TanStack Query hooks
  → tRPC v11 over HTTP with SuperJSON
Next.js 16 App Router
  → server components prefetch queries
  → HydrateClient
  → Suspense + error boundaries
  → tRPC routers (thin)
  → feature modules
Drizzle ORM v1
  → typed SQL-like queries in src/db/queries
Neon Postgres
  → 12 tables
Seed / OpenAPI sidecars
  → deterministic 24-month simulation
  → generated OpenAPI 3.1 + Scalar docs
```

#### Why Next.js full-stack

- One deployable, one language, one type system.
- Server components can prefetch directly through the tRPC caller; no internal HTTP hop.
- Route-level `force-dynamic` keeps the demo live without a build-time database.
- Trade-off: server/client boundaries must be explicit; a careless import can pull server code into the client bundle.
- Mitigation: `server-only`, feature `server/` folders, `"use client"` only where needed.

#### Why tRPC

- The API is consumed only by this app; there is no third-party client to support.
- End-to-end inference: DB query → router output → hook → component.
- Zod inputs at the boundary.
- Trade-off: tighter coupling to TypeScript; not a public REST API.
- Mitigation: generate an OpenAPI document for inspection and client generation.

#### Why Drizzle + Neon

- Drizzle gives SQL-like control and typed results without a heavy abstraction.
- Neon’s HTTP driver means no local Postgres server and no connection pool to manage in a demo.
- Trade-off: cold starts add roughly a second to the first query after idle.
- Trade-off: raw SQL windows are occasionally clearer than the query builder; those are localized in `src/db/queries`.

#### The request path

1. A route server component calls `batchPrefetchX()`.
2. `batchPrefetch` warms the per-request TanStack Query cache.
3. `HydrateClient` dehydrates the cache into the client.
4. Client components call feature hooks (`useSuspenseQuery`).
5. Charts/tables render from the same cache; mutations go back through tRPC.
6. `invalidateQueries` refetches the affected queries.

Link to `/docs/architecture/code-flow` for the detailed trace.

#### Deployment shape

- Vercel + Neon is the intended stack.
- Every dashboard page is `force-dynamic`; the build does not need a database.
- One env var: `DATABASE_URL` (Neon pooled connection string).
- Optional: `NEXT_PUBLIC_APP_URL` for absolute metadata URLs.
- Migrations and seed are run from a machine, not on every request.
- The demo is public and unauthenticated by design.

#### What this architecture deliberately does not have

- No separate backend service.
- No GraphQL.
- No microservices.
- No event bus or streaming ingestion.
- No auth or tenant isolation.
- No background job runner.
- No caching layer beyond TanStack Query and HTTP.

Explain why each omission is reasonable for the project, and what would trigger adding it.

#### Trade-offs

A table:

| Decision | Benefit | Cost | When I would change it |
|---|---|---|---|
| Next.js full-stack | One deploy, one type system | Server/client boundary discipline | If a mobile app or third-party API needed the same backend |
| tRPC | End-to-end types | TypeScript-only coupling | If external consumers needed a stable REST contract |
| Drizzle | SQL control + types | Smaller ecosystem than Prisma | If the team needed more ORM conveniences |
| Neon HTTP | No local DB server | Cold starts | If p95 latency became a hard requirement |
| `force-dynamic` | Live demo, simple build | No static caching | If read traffic grew and data freshness allowed caching |

### Code links

- `src/trpc/routers/_app.ts`
- `src/trpc/server.tsx`
- `src/trpc/client.tsx`
- `src/db/index.ts`
- `src/db/schema.ts`
- `src/app/api/trpc/[trpc]/route.ts`
- `scripts/generate-openapi.ts`

### Acceptance criteria

- [ ] Every “why” has a trade-off.
- [ ] The page is honest about no auth and no real-time ingestion.
- [ ] The request path links to the code-flow page.

## 2. `architecture/data-model.mdx`

Frontmatter:

```yaml
---
title: Data model
description: Twelve tables that model the path from area to society to household to dispenser to telemetry, service, complaints and billing.
---
```

### Required sections

#### The modeling question

- The schema is not a generic CRM. It is shaped around the decisions the dashboard must support:
  - area-level demand
  - household-level churn
  - device-level telemetry
  - subscription-level revenue
  - society-level expansion
- Every table earns its place by supporting one of those decisions.

#### The 12 tables

List each with a one-line purpose and key columns:

| Table | Purpose | Key columns |
|---|---|---|
| `areas` | Geographic operating zones | `name`, `infrastructure_age_years` |
| `societies` | Apartment complexes | `area_id`, `name`, `total_flats`, `onboarded_date` |
| `plans` | Product catalogue | `name`, `monthly_price`, `deposit` |
| `technicians` | Field workforce | `area_id`, `name`, `join_date`, `active` |
| `households` | Customers | `society_id`, `flat_number`, `join_date`, `status`, `cancel_date`, `risk_score` |
| `subscriptions` | Commercial relationship | `household_id`, `plan_id`, `start_date`, `end_date`, `status` |
| `dispensers` | Installed device | `household_id`, `type`, `install_date`, `last_filter_change_date`, `is_online` |
| `readings` | Telemetry | `dispenser_id`, `tds_ppm`, `ph`, `hardness`, `purity_pct`, `recorded_at` |
| `service_tickets` | Field work | `household_id`, `technician_id`, `type`, `status`, `raised_date`, `resolved_date`, `sla_hours` |
| `complaints` | Customer voice | `household_id`, `category`, `severity`, `resolved`, `date` |
| `payments` | Billing | `household_id`, `subscription_id`, `billing_month`, `amount`, `status`, `paid_date` |
| `leads` | Sales pipeline | `name`, `society_name`, `role`, `source`, `visit_date`, `converted`, `flats_converted`, `created_at` |

Explain the table relationships in prose.

#### The relationships

```text
areas 1─* societies 1─* households
households 1─* subscriptions *─1 plans
households 1─* dispensers 1─* readings
households 1─* service_tickets *─1 technicians
households 1─* complaints
households 1─* payments *─1 subscriptions
areas 1─* technicians
leads (standalone)
```

Call out the non-obvious choices:

- **One active subscription per household** — a household buys one plan at a time. History is preserved by `start_date` / `end_date`.
- **One dispenser per household** — the service installs one unit per flat. The model would need a join table if a household could have multiple devices.
- **Readings belong to a dispenser, not a household** — telemetry is a property of the physical device. If a device is replaced, the reading history stays with the old device.
- **Tickets and complaints are separate** — a complaint is the customer’s voice; a ticket is the operational response. One can exist without the other, and linking them would lose that distinction.
- **Leads are standalone** — a lead may not have a society yet, and a converted lead may create multiple households. A foreign key would over-constrain the funnel.

#### Type decisions

- `date` for business dates (`join_date`, `billing_month`, `last_filter_change_date`).
- `timestamp` for telemetry and created-at.
- Integer rupees, not floats. No rounding drift in money.
- Enums for plan, status, severity, ticket type, payment status, lead role.
- `risk_score` is denormalized on `households` so the risk table can sort/filter without recomputing for every row.

Explain the trade-off: denormalization makes reads fast, but the score must be recomputed when signals change. The app exposes a recompute mutation and the seed uses the same function.

#### Indexes

List the indexes that matter and why:

- `societies_area_idx` — area joins.
- `households_society_idx` — society → households.
- `households_status_idx` / `households_risk_idx` — risk table filters and sorting.
- `dispensers_household_idx` — one-to-one lookup.
- `readings_dispenser_recorded_idx` — latest readings and trend windows.
- `tickets_household_idx`, `tickets_status_idx` — board + household drawer.
- `complaints_household_date_idx` — risk windows and complaint trend.
- `payments_household_month_idx` — billing and overdue.
- `leads_created_idx` — recent-first list.

Read the actual schema and confirm the index names before writing. Do not invent indexes.

#### Why no snapshot tables

- MRR, retention, and impact are reconstructed from subscription spans.
- This keeps one source of truth and avoids a nightly job in a demo.
- Trade-off: the queries scan subscriptions and aggregate in JS for some trends; at a larger scale, a monthly snapshot table would be cheaper.

#### Trade-offs

- One dispenser per household is a simplification.
- No soft deletes; the demo uses hard deletes for tickets.
- No audit trail for mutations.
- No tenant column; the demo is single-tenant.
- No geospatial index despite lat/long columns.

### Code links

- `src/db/schema.ts`
- `src/db/index.ts`
- `src/db/queries/risk.ts`
- `src/db/queries/service-ops.ts`
- `drizzle.config.ts`
- `drizzle/` migrations

### Acceptance criteria

- [ ] All 12 tables are listed with purpose.
- [ ] The ERD is embedded.
- [ ] The non-obvious relationships are explained.
- [ ] Type decisions and indexes are justified.
- [ ] The denormalized risk score trade-off is explicit.

## 3. `architecture/api.mdx`

Frontmatter:

```yaml
---
title: API design
description: Thin tRPC routers, Zod-validated inputs, one cached request context, and an OpenAPI document generated from the router types.
---
```

### Required sections

#### The API surface

The app router has eight namespaces:

```ts
export const appRouter = createTRPCRouter({
  overview: overviewRouter,
  serviceOps: serviceOpsRouter,
  customers: customersRouter,
  devices: devicesRouter,
  revenue: revenueRouter,
  societies: societiesRouter,
  leads: leadsRouter,
  impact: impactRouter,
});
```

Link to `src/trpc/routers/_app.ts`.

For each router, list the procedures and one-line purpose. Read the actual routers; do not guess. Include mutations separately.

Example table:

| Namespace | Queries | Mutations |
|---|---|---|
| `overview` | `getKpis`, `getRevenueTrend`, `getHouseholdGrowth`, `getPlanMix`, `getAreaHealth` | — |
| `serviceOps` | `getBoard`, `getAreaDemand`, `getPredictive`, `getSlaStats`, `getTechnicianWorkload`, `getHouseholdsLite` | `createTicket`, `updateStatus`, `assign`, `remove` |
| `customers` | `getKpis`, `getAreas`, `getRiskTable`, `getRiskDistribution`, `getComplaintTrend`, `getById` | `recomputeRisk`, `createComplaint`, `resolveComplaint` |
| `devices` | `getAreas`, `getFleet`, `getReadings`, `getReadingsTrend`, `getAnomalies`, `getFleetStats` | — |
| `revenue` | `getKpis`, `getMrrTrend`, `getPlanMixTrend`, `getPaymentStatusByMonth`, `getCohortRetention`, `getOverdue` | `markPaid` |
| `societies` | `getKpis`, `getList`, `getGrowthTrend`, `getAreaPenetration`, `getById` | — |
| `leads` | `getKpis`, `getFunnel`, `getBySource`, `getList` | `create`, `update` |
| `impact` | `getTotals`, `getMonthlyTrend`, `getByPlan` | — |

#### Router discipline

- Routers are thin: validate input, call a query/mutation, return the result.
- Business logic lives in `src/db/queries/*`, not in the router.
- The same query functions are reused by the seed (risk) and by server prefetch.
- No `any` at the boundary.
- Zod schemas live in `src/trpc/schema/*` and are exported as types.

Show a short example from a real router, e.g. `leads.create` or `revenue.markPaid`. Explain:
- `input(schema)` validates.
- The mutation calls `createLead` / `markPaymentPaid`.
- The router does not format UI strings.

#### Validation

- Zod at every mutation boundary.
- Shared pagination/sort schemas in `src/trpc/schema/common.ts` if present.
- Query inputs with defaults (page, limit, sort) are parsed, not trusted.
- The client form and the server schema should agree; the router is the authority.

#### Context and auth

- `createTRPCContext` is cached per request and returns `{ db: getDb() }`.
- `authorizedProcedure` is currently an alias for `baseProcedure` because the demo has no auth.
- Say this explicitly. Do not imply there is authorization.
- What real auth would add:
  - a session lookup in context
  - an `orgId` / `userId` on every table
  - row-level filters in every query
  - middleware for role checks
- This is a deliberate demo trade-off, not an oversight.

#### Transport

- tRPC v11 over HTTP at `/api/trpc`.
- `httpBatchLink` batches client requests.
- SuperJSON survives dates and other non-JSON values.
- The same transformer must be used by any generated client.
- The server uses a per-request TanStack Query cache and `HydrateClient`.

#### OpenAPI and Scalar

- `scripts/generate-openapi.ts` generates an OpenAPI 3.1 document from `AppRouter`.
- Output: `public/openapi.json`, served at `/openapi.json`.
- Interactive reference: `/api-docs` via Scalar.
- Regenerated before every build (`bun run build` runs `openapi:generate`).
- Paths are relative to `/api/trpc`; `OPENAPI_SERVER_URL` can override.
- Because SuperJSON is used, generated clients must serialise/deserialise with the same transformer.

#### Error handling

- tRPC errors surface as `TRPCError` on the server and typed errors on the client.
- Feature hooks catch errors and show a toast; the query/mutation state also drives inline error UI.
- Mutations do not silently swallow failures.
- Tables and charts have explicit empty states, not blank cards.

#### Naming

- Queries: `getX` (`getKpis`, `getRiskTable`, `getPredictive`).
- Mutations: verb (`createTicket`, `markPaid`, `recomputeRisk`).
- Router namespaces match the route/feature names.
- No “handle” or “process” names.

#### Trade-offs

- tRPC is not a public REST API; the OpenAPI doc is a bridge, not a contract-first design.
- No versioning; the app and API deploy together.
- No rate limiting.
- No auth.
- No request-level tracing beyond server logs.

### Code links

- `src/trpc/init.ts`
- `src/trpc/procedures/authorizedProcedure.ts`
- `src/trpc/routers/_app.ts`
- `src/trpc/server.tsx`
- `src/trpc/client.tsx`
- `src/trpc/query-client.ts`
- `src/trpc/schema/`
- `src/app/api/trpc/[trpc]/route.ts`
- `scripts/generate-openapi.ts`

### Acceptance criteria

- [ ] The router table matches the code.
- [ ] The no-auth alias is explained honestly.
- [ ] OpenAPI/Scalar is explained.
- [ ] SuperJSON and batching are explained.
- [ ] Trade-offs are explicit.

## 4. `architecture/code-flow.mdx`

Frontmatter:

```yaml
---
title: Code flow
description: One feature, seven layers — from a Drizzle query to a server prefetch, a client hook, and a rendered chart.
---
```

### Required sections

#### The seven layers

Explain the seven layers as a text flow.

1. **DB query / mutation** — `src/db/queries/*`
2. **Zod schema** — `src/trpc/schema/*`
3. **tRPC procedure** — `src/trpc/routers/*`
4. **Server prefetch** — `src/features/<feature>/server/index.ts`
5. **Feature hook** — `src/features/<feature>/hooks/*`
6. **Client component** — `src/features/<feature>/components/*`
7. **Route page** — `src/app/(root)/(dashboard)/<route>/page.tsx`

Explain the rule: no client page fetches data directly. Every query goes through the same tRPC procedure, whether it runs on the server or in the browser.

#### A real trace: complaint trend

Walk through the actual code:

1. `getComplaintTrend` in `src/db/queries/customers.ts` groups complaints by month and category.
2. `customers.getComplaintTrend` exposes it as a query.
3. `prefetchComplaintTrend` warms it on the server.
4. `CustomersPage` calls `batchPrefetchCustomers()` and wraps sections in `Suspense`.
5. `useGetComplaintTrend` calls `useSuspenseQuery`.
6. `ComplaintTrendCard` renders the multi-line chart.
7. The client hydrates from the same cache; no fetch waterfall.

Include a compact table:

| Layer | File | Symbol |
|---|---|---|
| Query | `src/db/queries/customers.ts` | `getComplaintTrend` |
| Router | `src/trpc/routers/customers.ts` | `customers.getComplaintTrend` |
| Prefetch | `src/features/customers/server/index.ts` | `prefetchComplaintTrend` |
| Hook | `src/features/customers/hooks/use-get-complaint-trend.ts` | `useGetComplaintTrend` |
| Component | `src/features/customers/components/complaint-trend-card.tsx` | `ComplaintTrendCard` |
| Page | `src/app/(root)/(dashboard)/customers/page.tsx` | `CustomersPage` |

#### The route page pattern

Show the shape once, generically:

```tsx
export const dynamic = "force-dynamic";

export default function Page() {
  batchPrefetchFeature();

  return (
    <HydrateClient>
      <FeatureErrorBoundary>
        <Suspense fallback={<Skeleton />}>
          <ClientSection />
        </Suspense>
      </FeatureErrorBoundary>
    </HydrateClient>
  );
}
```

Explain:
- `force-dynamic` because the demo reads live data.
- `batchPrefetch` is fire-and-forget; it warms the cache, and `HydrateClient` serializes it.
- Each section gets its own `Suspense` so the page streams.
- The error boundary is per feature, with retry.

#### The prefetch implementation

Read `src/trpc/server.tsx` and explain:

- `getQueryClient` is `cache(makeQueryClient)` so the server uses one client per request.
- `prefetch` handles both normal and infinite queries.
- `batchPrefetch` loops over query options, firing them in parallel.
- `HydrateClient` dehydrates the cache; `defaultShouldDehydrateQuery` plus pending queries means the client can start in a pending state and suspend until the server promise resolves.

#### The client hook pattern

```ts
"use client";

export const useGetX = () => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.feature.getX.queryOptions());
};
```

- Hooks are thin.
- They do not format data for the chart; components own presentation.
- Mutations use `useMutation` with `mutationOptions`, `onSuccess` toast + invalidation, `onError` toast.

#### The mutation path

Trace a kanban drag:

1. `useUpdateTicketStatus` calls `trpc.serviceOps.updateStatus.mutationOptions`.
2. `onMutate` cancels the board query, snapshots the previous board, and writes the optimistic move.
3. The mutation runs; `onError` restores the snapshot and toasts.
4. `onSettled` invalidates the board, KPIs, area demand, and SLA.
5. The server is the source of truth; the optimistic state is temporary.

Explain why optimistic UI is appropriate for the kanban but not for “mark paid” (a payment mutation should show pending and then confirm).

#### Query keys and invalidation

- `queryOptions()` provides stable keys.
- Invalidate the smallest set that the mutation affects.
- Example: resolving a complaint invalidates the household profile, risk table, distribution, trend, and KPIs.
- Do not invalidate the whole client; it creates a refetch storm.

#### Error and empty states

- Suspense handles loading.
- Error boundaries handle query failure.
- Empty states handle “no rows” without pretending it is an error.
- Skeletons match the final layout to avoid layout shift.

#### Why this flow

- Server prefetch removes the client waterfall.
- One cache means server and client share data.
- Thin routers keep DB logic reusable and testable.
- Feature folders keep each route’s code together.

#### Trade-offs

- More files per feature than a single page component.
- The prefetch list must be kept in sync with the hooks; a missing prefetch causes a client fetch.
- `force-dynamic` gives up static caching.
- Optimistic updates add rollback complexity.

### Code links

- `src/trpc/server.tsx`
- `src/trpc/query-client.ts`
- `src/trpc/client.tsx`
- `src/features/customers/server/index.ts`
- `src/features/customers/hooks/use-get-complaint-trend.ts`
- `src/features/customers/components/complaint-trend-card.tsx`
- `src/app/(root)/(dashboard)/customers/page.tsx`
- `src/features/service-ops/hooks/use-update-ticket-status.ts`

### Acceptance criteria

- [ ] The seven layers are clear.
- [ ] The complaint-trend trace uses real symbols.
- [ ] The prefetch/hydrate mechanism is explained.
- [ ] The mutation path includes optimistic update + rollback + invalidation.
- [ ] The trade-offs are explicit.

## Verification

- All four pages render.
- Every code link points to a real file/symbol.
- No invented procedures or index names.
- `bun run build` passes.

Do not commit.
