# ProWater Case Study — Docs Prompt Pack

This folder contains the prompts used to build the recruiter-facing Fumadocs case study at `/docs`.

The goal is **not** to document every file. The goal is to help a recruiter or hiring manager understand, in this order:

1. What business problem this dashboard solves.
2. How the solution was designed.
3. Where the exact code lives.
4. What the work proves about the engineer who built it.

## How to use this pack

1. Run the prompts **in order**.
2. Read this file before every prompt. It contains shared project facts and writing rules.
3. Work from the repository root.
4. Read the real code before writing about it. Never invent a route, chart, file, query, number, or link.
5. Use the real GitHub repo: `https://github.com/Surajdusane/prow-dash`.
6. Do not create or use images. The docs use prose, code links, and tables only.
7. Leave changes uncommitted unless the user explicitly asks for a commit.

## Prompt order

| # | Prompt file | Produces |
|---|---|---|
| 01 | `01-foundation-and-shell.md` | Docs IA, `meta.json` files, MDX components, nav links, dashboard entry point |
| 03 | `03-home-short-long.md` | `/docs`, `/docs/overview/short`, `/docs/overview/long` |
| 04 | `04-two-ideas.md` | `/docs/ideas/predictive-service-demand`, `/docs/ideas/churn-risk` |
| 05 | `05-routes-overview-service-ops.md` | `/docs/routes`, `/docs/routes/overview`, `/docs/routes/service-ops` |
| 06 | `06-routes-customers-devices.md` | `/docs/routes/customers`, `/docs/routes/devices`, `/docs/routes/fleet` |
| 07 | `07-routes-revenue-societies.md` | `/docs/routes/revenue`, `/docs/routes/societies` |
| 08 | `08-routes-leads-sustainability.md` | `/docs/routes/leads`, `/docs/routes/sustainability` |
| 09 | `09-architecture.md` | `/docs/architecture/system`, `data-model`, `api`, `code-flow` |
| 10 | `10-data-simulation.md` | `/docs/architecture/data-simulation` |
| 11 | `11-engineering-and-about.md` | `/docs/engineering/performance`, `quality`, `/docs/about` |
| 12 | `12-qa-and-launch.md` | Final QA, build, links, deployment notes |

> The original prompt 02 for screenshots and diagrams is retired. Do not add screenshot or diagram assets. The docs must stand on prose, code links, and tables.

## Project snapshot

- **Product:** ProWater — a fictional piped RO drinking-water subscription service in Bangalore.
- **Dashboard:** Internal ops dashboard for service demand, churn risk, devices, revenue, societies, leads, and sustainability.
- **Repo:** `https://github.com/Surajdusane/prow-dash`
- **Docs:** Fumadocs v16 at `/docs`
- **Docs content:** `src/content/docs`
- **Dashboard routes:**
  - `/` — executive overview
  - `/service-ops` — kanban, predictive service, SLA, technician load
  - `/customers` — churn risk, complaints, household drawer
  - `/devices` — fleet telemetry, anomalies
  - `/devices/fleet` — full dispenser table
  - `/revenue` — MRR, plan mix, payments, cohorts, overdue
  - `/societies` — growth, penetration, society book
  - `/leads` — funnel, source conversion, lead table
  - `/sustainability` — litres served, jars avoided
  - `/api-docs` — Scalar/OpenAPI reference
  - `/dev/charts` — internal chart gallery (not recruiter-facing)

### Stack

- Next.js 16 App Router, React 19, React Compiler
- TypeScript
- tRPC v11, TanStack Query v5, SuperJSON, Zod v4
- Drizzle ORM v1 RC, Neon serverless Postgres
- Tailwind CSS v4, coss + shadcn components, Base UI/Radix
- ECharts 6 via evilcharts
- dnd-kit for the kanban
- Scalar + OpenAPI 3.1
- Fumadocs for this case study

### Data model — 12 tables

`areas`, `societies`, `plans`, `technicians`, `households`, `subscriptions`, `dispensers`, `readings`, `service_tickets`, `complaints`, `payments`, `leads`.

### Simulated data volumes

Use `~` because the seed is deterministic but the window is anchored to the day it runs:

- 8 areas
- 50 societies
- ~1,150 households (~85% active)
- ~1,000 dispensers
- ~250,000 telemetry readings
- ~7,000 service tickets
- ~2,500 complaints
- ~25,000 payments
- 450 leads
- 12 technicians
- 24 months of history
- `faker.seed(42)`

### Domain constants worth citing

- Plans: starter ₹499/mo, standard ₹799/mo, premium ₹1,199/mo.
- SLA targets: repair 48h, filter change 72h, inspection 96h, installation 120h.
- Predictive-service triggers: last 30 days of readings, latest 6 readings per dispenser, TDS slope ≥ 3.5 ppm/day, latest TDS ≥ 250, filter age ≥ 70 days, top 25 ranked.
- Risk score: 0–100; bands low < 34, medium 34–66, high ≥ 67.
- Risk cohort: ~13% of households; ~60% of them later cancel.
- Jar size for sustainability: 20 L.

### Seed commands

```bash
bun run db:seed    # only on an empty database
bun run db:reset   # truncate all 12 tables + reseed
```

## Global writing rules

### Audience

Write for two people at once:

1. **Recruiter / hiring manager** — wants the business problem, the decisions, and the impact.
2. **Technical interviewer** — wants the code, data model, trade-offs, and proof.

### Two reading speeds

- **Short** = 2–5 minutes. Business problem, what was built, what to click, what it proves.
- **Long** = 20–30 minutes. Research, schema, stack decisions, seed, feature loop, route evidence, limitations.

### Structure every technical page the same way

1. **Why this exists** — the business question and the decision it supports.
2. **Options considered** — what else was possible and why it was rejected.
3. **Decision** — what was chosen.
4. **Trade-off** — what the choice costs.
5. **Evidence** — code links and the chart/data mapping.

### Code links

- Use the `<SourceLink>` MDX component. Never paste raw GitHub URLs in prose.
- Link to files, not just folders.
- Use line anchors only for the key function a reader should inspect.
- If the repo is tagged, point `GITHUB_REF` at the tag instead of `main`.
- Every technical claim must have a code link nearby.

### No visual assets

- Do not add screenshots, diagrams, image galleries, or SVG illustrations.
- Use prose, tables, code links, and the existing dashboard charts as evidence.
- The dashboard itself remains the visual reference: link readers to the live route.

### Tone

- Start with the business question, not “This page shows…”.
- Be specific: name the query, the table, the chart, the trade-off.
- Do not use generic filler: “modern”, “scalable”, “robust”, “passionate”, “cutting-edge”.
- Do not claim production scale, real customers, or real IoT data. State that the data is simulated.
- Do not claim ML/AI. The risk score and predictive list are transparent heuristics.
- Be honest about limitations. A recruiter trusts a candidate who can name what is missing.

### Length limits

- Docs home: ≤ 900 words.
- Short page: ≤ 1,200 words.
- Long page: ≤ 4,500 words.
- Idea deep dive: ≤ 2,000 words each.
- Route page: ≤ 1,500 words each.
- Architecture/engineering page: ≤ 2,000 words each.

## Documentation file structure

```text
src/content/docs/
  meta.json
  index.mdx
  overview/
    meta.json
    short.mdx
    long.mdx
  ideas/
    meta.json
    predictive-service-demand.mdx
    churn-risk.mdx
  routes/
    meta.json
    index.mdx
    overview.mdx
    service-ops.mdx
    customers.mdx
    devices.mdx
    fleet.mdx
    revenue.mdx
    societies.mdx
    leads.mdx
    sustainability.mdx
  architecture/
    meta.json
    system.mdx
    data-model.mdx
    api.mdx
    code-flow.mdx
    data-simulation.mdx
  engineering/
    meta.json
    performance.mdx
    quality.mdx
  about.mdx
```

Delete the Fumadocs scaffold pages: `src/content/docs/example.mdx` and `src/content/docs/getting-started/`. They are noise for a recruiter.

## Custom MDX components

Build these in `src/features/docs/components/mdx/` and register them in `getMDXComponents`:

### `SourceLink`

```tsx
<SourceLink
  path="src/db/queries/risk.ts"
  symbol="computeHouseholdRisk"
  label="risk.ts"
/>
```

Behavior:

- Build `https://github.com/Surajdusane/prow-dash/blob/main/${path}${lines ? `#L${lines}` : ""}`.
- Open in a new tab.
- Show an external-link icon.
- Accessible label includes the symbol when provided.
- Use `encodeURI` for paths containing `(` or `)`.

### `RouteMeta`

```tsx
<RouteMeta
  live="/service-ops"
  time="6 min"
  repoPath="src/app/(root)/(dashboard)/service-ops/page.tsx"
/>
```

Behavior:

- A compact strip at the top of every route page.
- Links to the live route, shows read time, links to the page source.
- Use existing coss/shadcn primitives if they fit; otherwise plain Tailwind.

## Definition of done

- A recruiter can land on `/docs`, understand the project in 2 minutes, reach the two ideas, open the live route, and click into the exact code.
- Every route page has a chart/data/code table and a code map.
- Every technical claim has a code link.
- The short page is under ~1,200 words.
- The long page is under ~4,500 words.
- No Fumadocs scaffold pages remain in the sidebar.
- `bun run check-types` and `bun run build` pass.
- Internal docs links and external GitHub links work.
- The docs work on mobile.
- The dashboard sidebar links to `/docs`.
- The “Hire me” button goes to a real contact link.

## Non-goals

- Do not change the dashboard’s business logic.
- Do not add authentication.
- Do not change the seed data.
- Do not rewrite the README unless a path changes.
- Do not commit unless the user asks.
