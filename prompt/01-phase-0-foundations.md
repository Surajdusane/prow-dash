# Phase 0 — Foundations

> Read `prompt/00-master-plan.md` first. Work in this repo; follow `AGENTS.md`.

## Goal

Set up dependencies, DB indexes, the 8 dashboard routes, navigation, and shared widgets so every later phase has a place to plug in.

## Pre-flight (repo rules)

1. Run `bunx --no-install --package @tanstack/intent intent list` from the repo root and load the skill matching this task (if any).
2. Read the relevant guides in `node_modules/next/dist/docs/` before touching route files (this Next.js version differs from training data).

## Tasks

### 1. Dependencies & scripts
- `bun add -d @faker-js/faker`
- `bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- Add scripts to `package.json`:
  - `"db:seed": "tsx src/db/seed/index.ts"`
  - `"db:reset": "tsx src/db/seed/index.ts --fresh"`

### 2. DB indexes (`src/db/schema.ts`)
Add a third-argument array callback to the relevant tables (Drizzle v1 rc array form, e.g. `(t) => [index("readings_dispenser_recorded_idx").on(t.dispenserId, t.recordedAt)]`). Create indexes for:

| Table | Columns |
|---|---|
| readings | (dispenser_id, recorded_at) · (recorded_at) |
| payments | (billing_month) · (subscription_id) · (household_id) |
| service_tickets | (status) · (raised_date) · (technician_id) |
| complaints | (household_id, date) · (date) |
| households | (society_id) · (status) |
| dispensers | (household_id) · (is_online) |
| subscriptions | (status) · (household_id) · (plan_id) |
| societies | (area_id) |
| leads | (visit_date) · (converted) |

Then `bun run db:generate` and `bun run db:migrate`. **Verify** the new migration SQL contains `CREATE INDEX` statements.

### 3. Route restructure
- **Delete** the stub `src/app/(root)/page.tsx`.
- **Move** the charts gallery `src/app/(root)/(dashboard)/dashboard/home/page.tsx` → `src/app/(root)/(dashboard)/dev/charts/page.tsx`.
- Create placeholder server pages (each with `export const dynamic = "force-dynamic"`) that later phases fill in:
  - `src/app/(root)/(dashboard)/page.tsx` → `/` (overview)
  - `src/app/(root)/(dashboard)/service-ops/page.tsx`
  - `src/app/(root)/(dashboard)/customers/page.tsx`
  - `src/app/(root)/(dashboard)/devices/page.tsx`
  - `src/app/(root)/(dashboard)/revenue/page.tsx`
  - `src/app/(root)/(dashboard)/societies/page.tsx`
  - `src/app/(root)/(dashboard)/leads/page.tsx`
  - `src/app/(root)/(dashboard)/sustainability/page.tsx`
- Leave the `(docs)` route group untouched.

### 4. Navigation
- Rewrite `src/components/global/sidebar/main-menu.tsx` items: Overview `/`, Service Ops `/service-ops`, Customers `/customers`, Devices `/devices`, Revenue `/revenue`, Societies `/societies`, Leads `/leads`, Sustainability `/sustainability`. Remove the template children/examples.
- Update the `icons` map with suitable icons (lucide-react is installed; or extend `src/components/ui/icons.tsx`).
- Update `src/app/(root)/layout.tsx` metadata → ProWater Dashboard title/description.

### 5. Shared widgets
- `src/hooks/use-confirm.tsx` — expose `ConfirmationDialog` component + promise-based `confirm()` (per AGENTS.md import shape: `import { ConfirmationDialog, confirm } from "@/hooks/use-confirm";`). Build on the installed `src/components/ui/alert-dialog.tsx`. Render trigger-less; mount once in the dashboard layout or per usage site per the coss pattern.
- `src/components/dashboard/kpi-card.tsx` — KPI card (label, value, optional delta with up/down arrow + color, optional icon, optional hint) + a `KpiCardSkeleton`.

### 6. Verify
- `bun run check-types` · `bun run lint` · `bun run build` all pass.
- Click through the sidebar in `bun dev`; every route resolves.

## Definition of done

- [ ] faker + dnd-kit installed; `db:seed`/`db:reset` scripts present
- [ ] Index migration generated, applied, and visible in `drizzle/`
- [ ] `/` + 7 routes exist with `force-dynamic`, gallery moved to `/dev/charts`
- [ ] Sidebar shows the 8 ProWater routes with icons; metadata updated
- [ ] `use-confirm` + `KpiCard` exist and typecheck
- [ ] check-types / lint / build green — changes left uncommitted

## Gotchas

- All imports from `@/` — never relative `../`.
- Don't create branches or commits.
- Next 16 typed routes: new pages may need `bun run check-types` (runs `next typegen`) before links typecheck.
- Keep the sidebar's existing collapse/expand animation behavior intact — only replace the data arrays and icons.
