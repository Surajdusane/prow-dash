# Prompt 11 - Engineering and About

Read `docs-prompt/00-readme.md` first.

## Goal

Write:

- `src/content/docs/engineering/performance.mdx`
- `src/content/docs/engineering/quality.mdx`
- `src/content/docs/about.mdx`

The engineering pages should answer: *does this person write code that holds up?* The About page should answer: *who is this person, and how do I contact them?*

## 1. `engineering/performance.mdx`

Frontmatter:

```yaml
---
title: Performance
description: Server prefetch, batched queries, Suspense, bounded windows and indexed access - the choices that keep a data-heavy dashboard fast.
---
```

### Required sections

#### The performance problem

- Nine routes, each with 4–6 queries.
- A naive implementation would:
  - fetch in `useEffect` on the client
  - waterfall request after request
  - ship full tables to the browser
  - redraw charts on every render
- The page explains what was done instead.

#### Server prefetch + hydrate

- Every route is a server component.
- It calls `batchPrefetchX()` before rendering.
- `HydrateClient` dehydrates the per-request TanStack Query cache.
- Client hooks read the same cache; no client fetch on first paint.
- The user sees content immediately; the browser does not wait for a round trip.

Explain the subtle part:

- `prefetch` uses `void queryClient.prefetchQuery(...)` - it does not block the server render.
- `HydrateClient` dehydrates pending queries too, because `shouldDehydrateQuery` includes `query.state.status === "pending"`.
- The client `useSuspenseQuery` suspends until the server promise resolves.
- This is why the page can stream while queries are still in flight.

Link to `src/trpc/server.tsx` and `src/trpc/query-client.ts`.

#### Batched prefetch

- `batchPrefetch` loops over query options and fires them on the same request-scoped client.
- The tRPC client uses `httpBatchLink`, so client-side requests batch too.
- One route = one server prefetch pass, not one query at a time.

#### Suspense per section

- Each card/table has its own `<Suspense>`.
- Skeletons are shaped like the final content.
- One slow query does not block the whole page.
- The route shell and header paint immediately.

Link to the route pages and `src/components/dashboard/skeletons.tsx`.

#### Bounded data

- Charts cap at ≤60 points: monthly buckets for 18–24 months.
- Tables page at 25 rows.
- Predictive queue caps at 25.
- Fleet table pages server-side.
- Complaint trend uses 12 monthly buckets × categories, not raw rows.
- Readings drawer fetches one device’s series, not the whole fleet.

Link to the queries and explain the caps.

#### Server-side pagination, sorting, filtering

- Risk table, fleet table, society table, leads table, and overdue table accept page/limit/sort/filter inputs.
- The DB does the work; the client receives one page.
- The URL/feature state is the source of truth for table state where applicable.
- This prevents “fetch 25k payments and filter in React.”

#### Indexes aligned with access patterns

- `readings(dispenser_id, recorded_at)` for latest readings and windows.
- `payments(household_id, billing_month)` for billing.
- `complaints(household_id, date)` for risk windows.
- `service_tickets(household_id, status)` for board/drawer.
- `households(status, risk_score)` for the risk table.
- Confirm the actual indexes in `src/db/schema.ts` before writing.

#### Parallel queries

- Independent aggregates use `Promise.all` inside a query function.
- Example: `getOverviewKpis` runs subscription and payment aggregates in parallel.
- Example: `getAreaDemand` runs areas, households, tickets, and resolution aggregates in parallel.
- Do not parallelize dependent queries.

#### Chart rendering

- Charts are client components, wrapped in fixed-height containers.
- ECharts is heavy; only the chart components that need it import it.
- Data is memoized before chart config where the transformation is non-trivial.
- Empty states are handled before rendering a chart.
- No chart re-renders on every parent render; hooks/cache drive updates.

#### Caching and freshness

- TanStack Query `staleTime: 30s`.
- Mutations invalidate only the affected queries.
- `force-dynamic` on dashboard routes keeps the demo live.
- No Redis/CDN cache; the data must reflect live mutations.
- Trade-off: every request hits Neon.

#### Known costs

- Neon cold start: roughly one second after idle.
- ECharts bundle is the largest client cost.
- `force-dynamic` prevents static caching.
- Dashboards are chart-heavy, not image-heavy: no raster assets ship to the client.
- Seed is slow (minutes) but runs offline.

#### How to verify

- Open DevTools → Network on `/service-ops`.
- Expect one document request with the data already hydrated; no client-side data waterfall.
- If a refetch or mutation happens, `httpBatchLink` batches the tRPC calls into one request.
- Disable cache and repeat.
- Check that the KPI row does not wait for the slowest chart.
- Use React Profiler on the kanban drag; only the affected cards should re-render.

#### Trade-offs

| Decision | Benefit | Cost |
|---|---|---|
| Server prefetch | No client waterfall | More server work per request |
| `force-dynamic` | Live data | No static cache |
| 25-row pages | Small payloads | More requests when paging |
| 60-point charts | Fast render | Less granular detail |
| Neon HTTP | No pool management | Cold starts |
| Invalidation over polling | Correct after mutations | Refetch bursts if too broad |

### Code links

- `src/trpc/server.tsx`
- `src/trpc/query-client.ts`
- `src/trpc/client.tsx`
- `src/db/queries/overview.ts`
- `src/db/queries/service-ops.ts`
- `src/db/queries/customers.ts`
- `src/db/schema.ts`
- `src/components/dashboard/skeletons.tsx`
- one route page, e.g. `src/app/(root)/(dashboard)/service-ops/page.tsx`

### Acceptance criteria

- [ ] The prefetch/hydrate mechanism is explained accurately, including pending queries.
- [ ] The page is honest about Neon cold starts and ECharts bundle size.
- [ ] Every performance claim has a code link.
- [ ] No invented benchmark numbers.

## 2. `engineering/quality.mdx`

Frontmatter:

```yaml
---
title: Code quality
description: End-to-end types, feature boundaries, validation, error states, accessibility and tooling - what keeps the codebase maintainable.
---
```

### Required sections

#### The quality goal

- A solo project still needs guardrails.
- The goal is not “100% coverage”; it is:
  - types catch integration mistakes
  - every mutation validates input
  - every async surface has a loading, empty, and error state
  - features stay in their lane
  - the build is repeatable

#### End-to-end type safety

Trace one value:

```text
Postgres column
  → Drizzle inferred type
  → query return type
  → tRPC procedure output
  → TanStack Query data
  → component prop
```

- No `any` at the boundary.
- Zod schemas are the input authority; inferred types are exported.
- The router is typed against `AppRouter`.
- The client uses `createTRPCContext<AppRouter>()`.

Link to `src/db/schema.ts`, a query, a router, a hook, and a component.

#### Feature boundaries

- `src/features/<feature>/components`
- `hooks`
- `server`
- `schema` (where feature-specific)
- `utils`
- `types`
- `store` only where needed
- `index.ts` exports the public surface
- Route files stay thin: metadata, prefetch, Suspense, composition.

Explain why: a feature can be read, moved, or deleted without hunting across the app.

#### Validation

- Every mutation has a Zod input schema.
- Query inputs with pagination/sort/filter are validated too.
- Shared common schemas where appropriate.
- The server is the authority; client validation is for UX.
- Errors return through tRPC and become toasts, not silent failures.

#### Error, loading, empty states

- Per-feature error boundary with retry.
- Suspense skeletons shaped like content.
- Empty states with a title and a sentence explaining why there is no data.
- No blank cards, no infinite spinners.
- Charts and tables both handle empty arrays.

#### Mutations and feedback

- `toastManager.add` for success and error.
- `ConfirmationDialog` for destructive actions.
- Optimistic updates only where the interaction demands it (kanban).
- Rollback on error.
- Invalidate the smallest query set.

#### Accessibility

- Every form control has a label.
- Icon-only buttons have `aria-label`.
- Drawers/dialogs trap focus and close on Escape (via the primitive).
- Risk bands use text + color, not color alone.
- Charts have accessible titles/descriptions where the library supports them.
- Tables use semantic table elements.
- Keyboard: filters, dialogs, and the board should be reachable; dnd-kit provides keyboard sensors if configured. If the board is pointer-first, say so honestly.

#### Formatting and linting

- ESLint 9 + `eslint-config-next`.
- Prettier + Tailwind class sorting + import sorting.
- Husky + lint-staged on commit.
- `bun run lint`, `bun run format:check`, `bun run check-types`.
- `bun run build` regenerates OpenAPI and produces a production build.

#### Database quality

- Enums for constrained values.
- Integer money.
- `date` vs `timestamp` discipline.
- Indexes for access patterns.
- Migrations in `drizzle/`.
- Seed is deterministic and refuses to append to a non-empty DB.
- Risk score has one shared function used by seed and mutation.

#### Security and honesty

- No auth; the demo is public by design.
- Mutations are live and shared by all visitors.
- No secrets in client code; only `DATABASE_URL` on the server.
- `server-only` prevents server modules from leaking into the client.
- Do not claim tenant isolation, RBAC, or audit logging.

#### Testing - the honest gap

If the repo has no test suite, say so:

- No unit/integration/E2E suite in the snapshot.
- What was done instead:
  - `check-types`
  - `lint`
  - `build`
  - manual route QA
  - deterministic seed
- What I would add first:
  1. Unit tests for `computeHouseholdRisk` (boundaries, caps, bands).
  2. Unit tests for the predictive slope and filter-age triggers.
  3. Integration tests for mutations with a test database.
  4. Playwright smoke tests for the nine routes.
  5. A seed validation test: high-risk band enriched for the cohort.

This honesty is a strength. Do not invent a test suite.

#### Code review checklist

A short list a reviewer can use:

- Is the query bounded?
- Is the input validated?
- Is there a loading, empty, and error state?
- Does the mutation invalidate the right queries?
- Is the toast meaningful?
- Is the chart the right visual for the decision?
- Is the code in the right feature folder?
- Is the claim in the docs backed by code?

### Code links

- `eslint.config.*`
- `.prettierrc*`
- `.husky/`
- `package.json`
- `src/trpc/schema/`
- `src/db/schema.ts`
- `src/hooks/use-confirm.tsx`
- `src/components/ui/toast.tsx`
- `src/features/service-ops/hooks/use-update-ticket-status.ts`

### Acceptance criteria

- [ ] Type safety is traced end to end.
- [ ] Feature boundaries are explained.
- [ ] Loading/empty/error states are covered.
- [ ] The testing gap is stated honestly.
- [ ] Security claims are accurate.

## 3. `about.mdx`

Frontmatter:

```yaml
---
title: About
description: Who built ProWater, what I was optimising for, and how to get in touch.
---
```

### Required sections

#### Short intro

- Name: use the user's real name. If unknown, use `[Your name]` and a TODO.
- Role target: full-stack product engineer / SaaS engineer.
- One paragraph:
  - I like building products where the data model, the UI, and the business decision are tightly connected.
  - ProWater is a solo project: schema, seed, API, UI, charts, docs.
  - I care about making complex systems legible.

#### What I was optimising for

- Not “more features”; a coherent product story.
- Two original ideas, deeply implemented, instead of ten shallow CRUD pages.
- A schema that reflects the domain, not a generic template.
- A seed that makes the insights real.
- Documentation that lets a reviewer verify the work quickly.

#### How I work

- Start with the decision, then the data, then the UI.
- Build one vertical slice at a time.
- Prefer boring, explainable models over black boxes.
- Write the trade-off down.
- Make the empty/error/loading states part of the feature, not an afterthought.

#### Project facts

- Solo build.
- Stack: Next.js 16, React 19, TypeScript, tRPC, TanStack Query, Drizzle, Neon, Tailwind, ECharts, Fumadocs.
- 12 tables, 9 dashboard routes, 24 months of simulated data.
- Repo: `GITHUB_URL`.
- Live: `LIVE_URL` if deployed; otherwise say “run locally with `bun run dev`”.
- Docs: `/docs`.

#### What I’d build next

- Real telemetry ingestion.
- Auth + multi-tenancy.
- A calibrated churn model with monitoring.
- Tests and observability.
- Route optimisation for field service.

#### Contact

- GitHub: `https://github.com/Surajdusane`
- Email: `[your email]` - ask the user; do not invent.
- LinkedIn: `[your LinkedIn]` - ask the user; do not invent.
- CV: `[link]` - optional.
- CTA: “Hire me” → `CONTACT_URL`.

If contact details are unknown, keep the GitHub link and add a clear TODO. Do not ship a fake email.

#### A note on the demo

- Public, no auth.
- Mutations are live and shared.
- Data is simulated.
- `bun run db:reset` restores the dataset.

### Acceptance criteria

- [ ] The About page is personal but not generic.
- [ ] No fake contact details.
- [ ] The “what I’d build next” section is specific.
- [ ] The demo caveat is present.
- [ ] The page links to the repo and the live URL.

## Verification

- All three pages render.
- Every code link resolves.
- No invented metrics, tests, or contact details.
- `bun run build` passes.

Do not commit.
