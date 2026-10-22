# Prompt 03 — Docs home, short version, long version

Read `docs-prompt/00-readme.md` first.

## Goal

Write the three pages that carry the recruiter story:

- `src/content/docs/index.mdx` — case-study home (2 minutes)
- `src/content/docs/overview/short.mdx` — short version (5 minutes)
- `src/content/docs/overview/long.mdx` — long version (20–30 minutes)

This is the most important prompt. If only these three pages existed, a recruiter should still understand the project and want to inspect the code.

## Voice

- Confident, specific, calm.
- First person where it helps: “I modeled…”, “I chose…”, “I would change…”.
- No hype, no emojis, no generic adjectives.
- Every claim either has a number or a code link.
- Say clearly that the data is simulated.

## 1. Docs home — `src/content/docs/index.mdx`

Frontmatter:

```yaml
---
title: ProWater — Case Study
description: A full-stack ops dashboard for a piped RO water business, built to turn service telemetry and customer signals into two predictive workflows.
---
```

### Required sections

#### Hero

- H1: `ProWater — an ops dashboard built around two decisions`
- One-sentence thesis:

> ProWater is a full-stack ops dashboard for a piped RO water business: I modeled the domain, simulated 24 months of causal data, and built two predictive workflows — area-level service demand and household churn risk — behind a typed tRPC API and a server-rendered Next.js UI.

- CTA links:
  - **Live demo** → `LIVE_URL`
  - **GitHub** → `GITHUB_URL`
  - **Hire me** → `CONTACT_URL`
- Small badges/strip: `Next.js 16`, `tRPC`, `Drizzle`, `Neon`, `ECharts`, `Fumadocs`.

#### The two questions

Two cards or a two-column block:

1. **Where will service demand concentrate next, before complaints pile up?**
   - Predictive service demand — TDS trend + filter age → ranked queue.
   - Link: `/docs/ideas/predictive-service-demand`
2. **Which households are about to churn, and why?**
   - Complaint-based risk — complaints + payment behaviour + SLA misses → 0–100 score.
   - Link: `/docs/ideas/churn-risk`

#### By the numbers

A compact stat row or table:

- 24 months of simulated history
- 12 tables
- ~1,150 households
- ~250k telemetry readings
- ~7k service tickets
- 9 dashboard routes
- 0 mock JSON in the client

Use `~` for counts.

#### Start here

Use Fumadocs `Cards`/`Card` if available:

- **5-minute version** → `/docs/overview/short`
- **20-minute case study** → `/docs/overview/long`
- **Predictive service demand** → `/docs/ideas/predictive-service-demand`
- **Churn risk** → `/docs/ideas/churn-risk`
- **Route by route** → `/docs/routes`
- **Code entry points** → `/docs/architecture/code-flow`

#### Reviewer’s guide — what to watch

Six numbered checkpoints. This is the “what should I mainly look at?” section.

1. **`/service-ops`** — drag a kanban card; it mutates optimistically and persists. Then open the predictive table.
   - Code: `src/features/service-ops/hooks/use-update-ticket-status.ts`
   - Code: `src/db/queries/service-ops.ts` (`getPredictive`)
2. **`/customers`** — filter to high risk, open a household drawer, read the complaint/payment/SLA signals, then hit “Recompute risk”.
   - Code: `src/db/queries/risk.ts`
3. **`/revenue`** — read the cohort retention matrix, then mark an overdue payment paid and watch the queries invalidate.
   - Code: `src/features/revenue/hooks/use-mark-paid.ts`
4. **`/`** — scan the six KPIs, billed vs collected, and area health. This is the 60-second executive view.
   - Code: `src/db/queries/overview.ts`
5. **Network tab** — one batch prefetch per route, no client-side fetch waterfall.
   - Code: `src/features/*/server/index.ts`
6. **Seed** — run `bun run db:reset` and confirm the dataset is deterministic.
   - Code: `src/db/seed/index.ts`

Each item should be a link plus one line explaining what to notice.

#### What this proves

A capability matrix. Use exactly this shape:

| Capability | Evidence | Where to look |
|---|---|---|
| Domain research | 12-table model of households → dispensers → telemetry → service → billing | `src/db/schema.ts` |
| Product thinking | Two ops decisions, 9 routes, deliberate omissions | short version, route map |
| Data engineering | Deterministic 24-month simulation with causal tickets | `src/db/seed` |
| Backend/API | Thin tRPC routers, Zod inputs, typed Drizzle queries | `src/trpc`, `src/db/queries` |
| Frontend craft | Server prefetch, Suspense, skeletons, drawers, optimistic DnD | route pages |
| Performance | Indexed queries, windows, pagination, ≤60 chart points | engineering/performance |
| Type safety | DB → query → router → hook → component | architecture/code-flow |
| Communication | This case study, method notes, trade-offs | `/docs` |
| Ownership | Seed, migrations, build, reset, deployment notes | README, data simulation |

Link each row to the relevant page or file.

#### Code entry points

Six links only. Do not dump the whole repo:

1. `src/db/schema.ts` — the domain model
2. `src/db/seed/index.ts` — the simulation pipeline
3. `src/db/queries/risk.ts` — shared churn score
4. `src/db/queries/service-ops.ts` — predictive service query
5. `src/features/service-ops/server/index.ts` — server prefetch
6. `src/trpc/routers/_app.ts` — the API surface

Use `<SourceLink>` for each.

#### A note on the data

A `Callout type="info"`:

> All company names, people, payments, and telemetry are simulated. The seed is deterministic (`faker.seed(42)`) and anchored to the day it runs, so the dashboard’s patterns are real to the dataset, not random rows.

Link to `/docs/architecture/data-simulation`.

#### Footer

Repeat the three links: Live demo, GitHub, Hire me. Add “Built by Suraj Dusane” if the user confirms the name.

### Length

≤ 900 words.

## 2. Short version — `src/content/docs/overview/short.mdx`

Frontmatter:

```yaml
---
title: The 5-minute version
description: The problem, the two predictive workflows, what was built, and what to inspect first.
---
```

### Required sections

1. **One-paragraph summary** — the thesis, in plain language.
2. **The two questions** — one paragraph each, with the route link.
3. **What I built** — 5 bullets:
   - 12-table Postgres model
   - deterministic 24-month simulation
   - 9 routes across ops, growth, revenue, devices
   - tRPC + TanStack Query + Drizzle, fully typed
   - server-rendered pages with Suspense, skeletons, error boundaries
4. **How I approached the work** — exactly 7 numbered steps:
   1. Researched the service and the data it produces.
   2. Designed the schema around the decisions the dashboard must support.
   3. Chose Next.js full-stack so there is no separate backend to maintain.
   4. Chose TypeScript + tRPC + TanStack Query + Drizzle + Zod for one type-safe path.
   5. Wrote a deterministic seed with injected patterns.
   6. Built one feature at a time: query → schema → router → prefetch → hook → component.
   7. Chose the chart/route only after the data and the decision were clear.
5. **What to click first** — 5 links, one line each:
   - `/service-ops`
   - `/customers`
   - `/revenue`
   - `/devices`
   - `/`
6. **What to mainly watch** — 5 concrete checkpoints, each with a code link:
   1. `/service-ops` — drag a kanban card, then compare the predictive queue with the area demand chart.
      - `src/features/service-ops/hooks/use-update-ticket-status.ts`
      - `src/db/queries/service-ops.ts`
   2. `/customers` — filter to high risk, open a household, then hit “Recompute risk”.
      - `src/db/queries/risk.ts`
   3. `/revenue` — read the cohort matrix, then mark an overdue payment paid.
      - `src/features/revenue/hooks/use-mark-paid.ts`
   4. **Network tab** — one batched tRPC prefetch per route, not a client waterfall.
      - `src/features/service-ops/server/index.ts`
   5. **Seed** — run `bun run db:reset` and confirm the patterns reappear.
      - `src/db/seed/index.ts`
7. **Code links** — a compact list, not a repo dump:
   - `src/db/schema.ts`
   - `src/db/seed/index.ts`
   - `src/db/queries/service-ops.ts`
   - `src/db/queries/risk.ts`
   - `src/features/service-ops/server/index.ts`
   - `src/trpc/routers/_app.ts`
   - GitHub repo: `GITHUB_URL`
8. **What this proves** — a shorter version of the capability matrix (5 rows).
9. **What this dashboard shows you** — leave this section **blank**. Add the heading and an MDX comment `{/* User to fill in. */}`. Do not invent content.
10. **Read next** — long version, the two idea pages, GitHub, live demo, contact.

### What not to do

- Do not explain the whole schema here.
- Do not list every file.
- Do not repeat the README feature table.
- Do not exceed ~1,200 words.

## 3. Long version — `src/content/docs/overview/long.mdx`

Frontmatter:

```yaml
---
title: The full case study
description: Research, domain model, stack decisions, data simulation, feature loop, route evidence, and trade-offs.
---
```

### Required sections

#### Summary

A 3–4 paragraph summary before any detail:

- ProWater is a fictional piped RO water business in Bangalore.
- The dashboard turns two operational questions into workflows: predictive service demand and complaint-based churn risk.
- The data is a deterministic 24-month simulation, not random rows.
- The stack is Next.js 16, tRPC, Drizzle, Neon, ECharts, and Fumadocs.
- The result is one deployable with a typed API, server-rendered pages, and a recruiter-facing case study.

Keep this section under ~250 words. It is the “if you read nothing else” version.

#### How I approached the work

Exactly 7 steps. For each, name the decision, the alternative, and the evidence:

1. **Researched the service and the data it produces.** Societies, households, subscriptions, dispensers, telemetry, tickets, complaints, payments, leads. Link to `/docs/architecture/data-model`.
2. **Designed the schema around decisions, not entities.** 12 tables; one active subscription per household; one dispenser per household; readings belong to devices; tickets and complaints are separate. Link to `src/db/schema.ts`.
3. **Chose the framework.** Next.js full-stack instead of a separate API + SPA, because the product is one read-heavy dashboard and one deployable. Link to `/docs/architecture/system`.
4. **Chose the stack.** TypeScript, tRPC, TanStack Query, Drizzle, Neon, Zod, Tailwind, ECharts, Fumadocs. Each choice has a trade-off. Link to the stack table below.
5. **Seeded the data.** Deterministic `faker.seed(42)`, 24-month window, ten stages, causal patterns. Link to `/docs/architecture/data-simulation`.
6. **Built one feature at a time.** Query → schema → router → server prefetch → hook → component → route. Link to `/docs/architecture/code-flow`.
7. **Chose charts and routes after the data was clear.** Trend → area/line; category comparison → bar; part-to-whole → donut; single % vs target → gauge; ranking → sorted bar; cohort × time → matrix; action list → table + drawer. Link to `/docs/routes`.

#### 1. The brief

- What ProWater is: piped RO drinking water, subscription, Bangalore, societies and households, IoT dispensers, field technicians.
- What the ops team needs:
  - where revenue is leaking
  - what is about to break
  - where field capacity is strained
  - where to expand
- Why I chose this domain: it forces product thinking, a real schema, time-series data, and operational UI.

#### 2. Research and assumptions

A table:

| Assumption | Why I made it | Where it shows up |
|---|---|---|
| One active subscription per household | A household buys one plan at a time | `subscriptions` |
| One dispenser per household | The service installs one unit per flat | `dispensers` |
| Telemetry every 2–3 days | Enough signal without pretending to be real-time IoT | `readings` |
| Filter changes reset TDS | Physical filter behaviour | `dispensers.last_filter_change_date`, seed |
| Complaints and payments precede churn | The ops hypothesis I wanted to test | risk score |
| Area infrastructure age drives demand | Older plumbing → siltier inlet water | `areas.infrastructure_age_years` |

Explain that these are product assumptions, not claims about a real company.

#### 3. Domain model

- 12 tables and the path:
  `areas → societies → households → subscriptions → plans`
  `households → dispensers → readings`
  `households → service_tickets → technicians`
  `households → complaints`
  `households → payments → subscriptions`
  `leads` (standalone)
- Key decisions:
  - enums for plan, status, severity, ticket type, payment status
  - `date` for business dates, `timestamp` for telemetry
  - integer rupees, not floats
  - risk score denormalized on `households`
  - indexes for the actual access patterns
- Link to `/docs/architecture/data-model` and the ERD.

#### 4. Stack decisions

Use a table with **Option considered → Chosen → Trade-off**:

| Area | Option considered | Chosen | Trade-off |
|---|---|---|---|
| Framework | Separate API + SPA | Next.js full-stack | One deployable, but server/client boundaries must be explicit |
| API | REST | tRPC | End-to-end types, but tighter coupling to TypeScript |
| Data fetching | Client `fetch` in `useEffect` | Server prefetch + TanStack Query | More setup, no waterfall |
| ORM | Raw SQL / Prisma | Drizzle | Typed SQL-like queries, but a smaller ecosystem |
| Database | Local Postgres | Neon serverless | No local server, but cold starts |
| Validation | Manual checks | Zod | Extra schemas, safer inputs |
| Charts | Recharts | ECharts/evilcharts | More power, larger bundle |
| UI | Custom only | coss/shadcn + Base UI/Radix | Faster, but a dependency surface |
| Kanban | Table with status dropdown | dnd-kit | Better UX, more state complexity |
| Docs | README only | Fumadocs | More work, better recruiter experience |

For each row, link to the relevant code or docs page.

#### 5. Data simulation

- Why: random rows cannot prove a predictive workflow.
- How: `faker.seed(42)`, 24-month window, 10 stages.
- Injected patterns:
  - area infrastructure age → faster filter degradation
  - TDS curve → causal repair/filter tickets
  - monsoon seasonality → hardness/complaint spikes
  - risk cohort → complaint clusters + late/failed payments + churn
  - growth waves → societies onboard over 14 months
  - plan mix shift → starter early, standard/premium later
  - technician load weights → visible imbalance
- Link to `/docs/architecture/data-simulation`.
- One `Callout` that the data is simulated.

#### 6. The feature loop

The 7-step flow, with a real trace:

1. DB query/mutation in `src/db/queries/*`
2. Zod schema in `src/trpc/schema/*`
3. Thin tRPC procedure in `src/trpc/routers/*`
4. Server prefetch in `src/features/<feature>/server/index.ts`
5. Feature hook in `src/features/<feature>/hooks/*`
6. Client component in `src/features/<feature>/components/*`
7. Route page: `prefetch → HydrateClient → Suspense → ErrorBoundary → client component`

Then trace **complaint trend** end to end:

`complaints` → `getComplaintTrend` → `customers.getComplaintTrend` → `prefetchComplaintTrend` → `useGetComplaintTrend` → `ComplaintTrendCard` → `customers/page.tsx`.

Link to `/docs/architecture/code-flow` for the full version.

#### 7. The two ideas in depth

Two subsections, each ~150 words, then “Read the full deep dive”:

- Predictive service demand — why, what data, what the queue does, what it proves.
- Churn risk — why, the score, validation, what support can do.

#### 8. Route map

A table with one row per route:

| Route | Question it answers | Main visuals | Data source |
...

Link each route to its `/docs/routes/*` page.

#### 8.1 What to mainly watch

Six checkpoints for a reviewer. Each one should say what to click, what to notice, and where the code is:

1. **`/service-ops`** — drag a kanban card; it mutates optimistically and persists. Then open the predictive table and compare the top rows with the area demand chart.
   - `src/features/service-ops/hooks/use-update-ticket-status.ts`
   - `src/db/queries/service-ops.ts`
2. **`/customers`** — filter to high risk, open a household drawer, read the complaint/payment/SLA evidence, then hit “Recompute risk”.
   - `src/db/queries/risk.ts`
   - `src/features/customers/components/household-drawer/*`
3. **`/revenue`** — read the cohort retention matrix, then mark an overdue payment paid and watch the queries invalidate.
   - `src/features/revenue/hooks/use-mark-paid.ts`
   - `src/db/queries/revenue.ts`
4. **Network tab** — one batched tRPC prefetch per route, no client-side fetch waterfall.
   - `src/features/service-ops/server/index.ts`
   - `src/trpc/server.tsx`
5. **Seed** — run `bun run db:reset` and confirm the same patterns reappear.
   - `src/db/seed/index.ts`
   - `src/db/seed/patterns.ts`
6. **Code flow** — trace the complaint trend from query to chart.
   - `/docs/architecture/code-flow`

#### 8.2 Code links and repo

A compact “start here” list, not a repo dump. Use `<SourceLink>`:

- `src/db/schema.ts` — the 12-table domain model
- `src/db/seed/index.ts` — the ten-stage simulation
- `src/db/queries/service-ops.ts` — predictive service
- `src/db/queries/risk.ts` — churn score
- `src/db/queries/overview.ts` — executive KPIs
- `src/db/queries/customers.ts` — risk table + household profile
- `src/db/queries/revenue.ts` — MRR, plan mix, cohorts
- `src/features/service-ops/server/index.ts` — server prefetch
- `src/trpc/routers/_app.ts` — the API surface
- `src/trpc/server.tsx` — `prefetch` / `batchPrefetch` / `HydrateClient`

Add the GitHub repo link explicitly:

> **Repo:** [`Surajdusane/prow-dash`](https://github.com/Surajdusane/prow-dash)

#### 9. Engineering quality

- Server prefetch + hydrate; no client fetch waterfall.
- Suspense per section; skeletons shaped like content.
- Error boundaries with retry.
- Empty states for every chart/table.
- Mutations: toast + invalidation; kanban optimistic update.
- Server pagination/sorting/filtering for tables.
- Query windows and chart caps (≤60 points).
- Indexes aligned with access patterns.
- Type safety from DB to UI.
- Accessibility: labels, keyboard, color + text for risk bands.

Link to `/docs/engineering/performance` and `/docs/engineering/quality`.

#### 10. Trade-offs and limitations

Be explicit:

- Simulated data, not real IoT.
- Risk score is a transparent heuristic, not a trained model.
- Predictive list is a batch query over recent readings, not streaming.
- No auth; public demo by design.
- No automated test suite (if true) — say what you did instead and what you would add.
- Single-tenant demo; no multi-company isolation.

This section builds trust. Do not hide it at the bottom of the page.

#### 11. What I’d build next

- Real ingestion (MQTT/HTTP) and streaming anomaly detection.
- Multi-tenant auth and per-company isolation.
- Calibrated churn model with precision/recall monitoring.
- Alerting and assignment automation.
- Tests: unit tests for risk score and predictive slope, integration tests for tRPC procedures, Playwright for the critical routes.
- Observability: query timings, error tracking, slow-query budgets.

#### 12. What this dashboard shows you

Create the heading, then leave the section **blank**:

```mdx
## What this dashboard shows you

{/* User to fill in. Do not invent this section. */}
```

Do not write a capability matrix here. The home page and the About page already carry the “what this proves” narrative. This section is intentionally reserved for the author’s own answer.

#### 13. Links

Live demo, GitHub repo (`https://github.com/Surajdusane/prow-dash`), contact, route map, code entry points.

### Length

≤ 4,500 words.

## Writing checks before finishing

- The thesis appears on all three pages, worded consistently.
- The two ideas are linked from all three pages.
- Short and long both include: a summary, code links, the GitHub repo, “what to mainly watch,” and how the work was approached.
- The 7-step approach appears in both short and long.
- The long page has a visible “What this dashboard shows you” heading and no invented content under it.
- Every route link works.
- Every code link points to a real file.
- Counts use `~` and match the seed.
- The simulated-data disclaimer appears on the home page and long page.
- No paragraph starts with “This page…”.
- No generic filler.

## Acceptance criteria

- [ ] Home page is scannable in 2 minutes.
- [ ] Short page is ≤ 1,200 words.
- [ ] Long page is ≤ 4,500 words.
- [ ] Both short and long include a summary, code links, GitHub, “what to mainly watch,” and the 7-step approach.
- [ ] “What this dashboard shows you” exists and is blank.
- [ ] All three pages link to the two idea pages and the route map.
- [ ] Reviewer’s guide has 6 concrete checkpoints.
- [ ] Capability matrix has evidence + links.
- [ ] `bun run build` passes.
