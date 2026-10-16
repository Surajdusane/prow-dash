# Phase 6 — Polish & Deploy

> Read `prompt/00-master-plan.md` first (§9 deploy plan). Work in this repo; follow `AGENTS.md`. Never create commits/branches — the user handles git.

## Goal

Ship a production-quality portfolio build: polish pass, README, Neon migrate/seed, Vercel live.

## 1. Polish pass

- **Loading states:** every Suspense fallback uses skeletons shaped like the real content (KPI row, table rows, chart cards) — no spinners-only screens.
- **Empty states:** every table/chart has an `Empty` component state ("No tickets in range", "No anomalies — fleet healthy").
- **Error boundaries:** human fallback + retry where practical.
- **Responsive:** verify all 8 routes at 375px / 768px / 1440px. Tables: horizontal scroll or collapse to cards on mobile. Kanban: horizontal scroll columns.
- **Metadata:** title template "ProWater · {page}", description, favicon, OG image (static `public/` asset is fine).
- **Cleanup:** decide on `/dev/charts` gallery — either delete it or keep it out of nav (if kept, link it in the README as the design reference).
- **Perf sanity:** no accidental full-table payloads (charts ≤ 60 points, tables 25/page); check the Neon query count per page load is small (batched prefetch).

## 2. README (portfolio-grade)

Sections: what it is (one paragraph) · screenshots/GIF (overview + kanban + risk table) · architecture diagram (Next.js → tRPC → Drizzle → Neon) · **"How the data was simulated"** (patterns: growth curve, filter degradation, causal tickets, seasonality, risk cohort, area imbalance — this is the interview gold) · route-by-route feature list · tech stack · local setup (`bun install`, `.env`, `db:migrate`, `db:reset`, `dev`) · deploy notes · **explicit note: public demo, no auth, mutations are live and reset by re-seeding.**

## 3. Deploy to Vercel (Neon)

1. Local gates: `bun run check-types && bun run lint && bun run build` all green.
2. Neon: use the **pooled** connection string (`...-pooler...`). From your machine: `bun run db:migrate` then `bun run db:reset` (seeds the remote DB — same DB Vercel reads).
3. Push the repo to GitHub (user's action).
4. Vercel → New Project → import repo → framework auto-detect (Next.js), install auto-detects `bun.lock`, Node 22.x.
5. Env vars (Production + Preview):
   - `DATABASE_URL` = Neon pooled URL (required)
   - `NEXT_PUBLIC_APP_URL` = `https://<app>.vercel.app` (optional)
   - `CRON_SECRET` = random string (only if adding the cron below)
6. Dashboard pages are already `force-dynamic` → build has no DB dependency; data is always live.
7. **Optional cron (recommended talking point):** add `vercel.json`:
   ```json
   { "crons": [{ "path": "/api/cron/risk-recompute", "schedule": "0 2 * * *" }] }
   ```
   and `src/app/api/cron/risk-recompute/route.ts` — a route handler (infra only, allowed exception to "tRPC only") that checks `Authorization: Bearer ${CRON_SECRET}` and calls `recomputeAllRiskScores` from `src/db/queries/risk.ts`. Hobby tier allows 2 daily crons.
8. **Smoke test on prod:** every route loads with data · drag one kanban card · mark one payment paid · recompute risk · create + delete a ticket (confirm dialog) · check Vercel function logs are clean · confirm Neon cold start is the only perceivable delay.
9. Optional: `@vercel/analytics`, custom domain.

## Definition of done

- [ ] No raw spinners, no dead ends, no console errors on any route
- [ ] README complete with screenshots + simulation methodology + public-demo note
- [ ] Production URL live and passing the smoke checklist
- [ ] Re-seed procedure documented (how to reset demo data end-to-end)
- [ ] All changes left uncommitted for the user to review
