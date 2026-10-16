# ProWater Dashboard — Build Prompts

This folder contains the full build plan for the **ProWater Internal Monitoring Dashboard**, split into prompts you can hand to an AI coding agent one phase at a time.

## How to use

1. Open a session with a coding agent **in this repo** (it picks up `AGENTS.md` conventions).
2. Paste `00-master-plan.md` once at the start for full context.
3. Then paste **one phase prompt at a time, in order**, and finish its "Definition of done" checklist before moving on.
4. Each prompt is self-contained: context → tasks → definition of done → gotchas.

## Files

| File | Purpose |
|---|---|
| `00-master-plan.md` | Full context: product, data model, conventions, seed plan, route specs, API surface, deploy plan |
| `01-phase-0-foundations.md` | Deps (faker, dnd-kit), DB indexes, route restructure, nav, shared widgets |
| `02-phase-1-seed.md` | Faker seed script with injected patterns + shared risk-score function |
| `03-phase-2-api-layer.md` | `src/db/queries` + zod schemas + tRPC routers |
| `04-phase-3-overview-service-ops.md` | `/` overview + `/service-ops` kanban (dnd-kit) |
| `05-phase-4-customers-devices.md` | `/customers` risk module + `/devices` IoT fleet |
| `06-phase-5-revenue-societies-leads-sustainability.md` | Remaining 4 routes |
| `07-phase-6-polish-deploy.md` | Polish, README, Neon + Vercel deployment |

## Locked decisions

- **No auth gate** — fully public demo, all mutations live. The README must state this is a deliberate demo choice.
- **@dnd-kit** (`@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`) for the Kanban board.
- **All 8 routes**, built in the order above, each shipped end-to-end.
- **Strictly tRPC** for app data — no REST route handlers except the optional cron endpoint.
- **evilcharts** for every chart; **coss/shadcn** for UI; **toast** (`toastManager`) for all messages; **use-confirm** for all confirmations; imports always from `@/`.

## Sequencing rules

- Never start a phase before the previous phase's acceptance checks pass.
- Run `bun run check-types` and `bun run build` at the end of every phase.
- Never create git branches, worktrees, or commits automatically — leave changes uncommitted.
