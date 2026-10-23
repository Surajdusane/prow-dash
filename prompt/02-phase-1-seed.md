# Phase 1 - Seed Script

> Read `prompt/00-master-plan.md` first (§6 is the spec). Work in this repo; follow `AGENTS.md`.

## Goal

Generate a deterministic, pattern-rich 24-month dataset via `@faker-js/faker` so the dashboard's insights (predictive maintenance, churn risk, area imbalance) are real and explainable - plus the shared risk-score module.

## Deliverables / files

```
src/db/seed/
  index.ts        # orchestrator, --fresh flag, logging, summary counts
  reference.ts    # areas, plans, technicians (static)
  patterns.ts     # seasonality multiplier fn, degradation fn, date helpers
  generators/
    societies.ts  households.ts  dispensers.ts  readings.ts
    tickets.ts    complaints.ts  payments.ts    leads.ts
src/db/queries/risk.ts   # computeHouseholdRisk() + recomputeAllRiskScores(db)
```

Notes:
- `index.ts` must `import "dotenv/config"` first and import the `db` client from `@/db` (tsx resolves `@/` via tsconfig paths).
- Deterministic: call `faker.seed(42)`; anchor all dates to a fixed `TODAY` at run time minus nothing - generate backwards 24 months from today.
- `--fresh` flag runs `TRUNCATE TABLE ... RESTART IDENTITY CASCADE` (all 12 tables), then seeds. Without it, expect/require empty tables and warn otherwise.
- Batch all inserts: ≤ 1,000 rows per `db.insert(...).values(batch)` (Neon HTTP param limits). Generate per-dispenser (readings/tickets) and insert in chunks - never hold all 250k readings in memory.
- Log progress per stage with row counts.

## Reference data

- **Areas (8, Bangalore):** HSR Layout, Whitefield, Koramangala, Indiranagar, Jayanagar, Sarjapur Road, Electronic City, Hebbal. Set `infrastructureAgeYears` so **2–3 areas are notably high** (e.g. Whitefield 14, Electronic City 12, Sarjapur Road 10; others 3–6) - this is the lever for area-wise service demand.
- **Plans (3):** starter ₹499/mo (no dispenser, own_device), standard ₹799/mo (includes dispenser), premium ₹1,199/mo (includes dispenser). Deposits ₹2,000/3,000/5,000.
- **Technicians (12):** distributed across areas, weighted 2–3 in high-infra areas, stagger `joinDate`, active mostly true.

## Generation order & patterns

1. **Societies (50):** onboarded in waves across months 1–14 (growth curve, not uniform). `totalFlats` 80–400, lat/lng jittered around area centers.
2. **Households + Subscriptions (~1,150, ≈85% active):** join dates follow society onboard month + spread. Plan mix shifts toward standard/premium over the 24 months. Cancelled households get `cancelDate` (mostly from the risk cohort, later months). Billing cycle "monthly".
3. **Dispensers (~1 per household):** `type` follows plan (starter → own_device); `installDate` ≈ join date + few days; `isOnline` ~96% true; initial `lastFilterChangeDate` = install date (later updated by filter-change tickets).
4. **The causal core - per-dispenser timeline (readings + tickets together):**
   - For each dispenser, simulate a timeline over its active life: schedule ~filter changes every 60–75 days (jittered).
   - Between changes, TDS drifts upward and purity/hardness degrade (e.g. TDS from ~120 baseline creeping +1.5–3/week to a ~450–550 ceiling; purity 96% → 84%).
   - **Sharp reset to baseline immediately after each filter change.**
   - Readings taken 2–3×/week: tdsPpm, ph ~6.8–7.4, hardnessMgl, purityPct - with seasonality (monsoon: higher hardness/TDS creep rate; summer: faster usage-driven creep).
   - **Filter-change tickets are emitted at the scheduled change events. Repair tickets are emitted when the drift crosses a hard threshold early** (TDS > 500 or purity < 85%). This makes the predictive signal genuinely predictive.
   - High-infra areas: faster drift + more early-threshold repairs (area imbalance made causal).
   - Ticket assignment: technician from the same area (2–3 techs carry disproportionate load in high-infra areas). Status: older → resolved; recent two weeks → mix of open/in_progress. `resolvedDate` per 48–120h by type; compute `slaMet` (repair 48h, filter_change 72h, inspection 96h, installation 120h).
   - On filter_change resolved: update the dispenser's `lastFilterChangeDate`.
   - Also sprinkle `installation` tickets at household join (~70%) and occasional `inspection` tickets.
5. **Complaints (~2.5k):** seasonal bumps (monsoon: water_quality/device_malfunction; service_delay during peak months) + **risk cohort injection (~12% of households):** clusters of 2–4 complaints + late/failed payments within a contiguous 2–4 month window; some of those households cancel ~1–3 months later. Older complaints resolved with `resolutionDate`; recent ones mix.
6. **Payments (~25k):** one row per active subscription-month. `amount` = plan price. Base weights: paid 88%, late 8%, failed 4%; risk-cohort households weight late/failed much heavier during (and slightly before) their cluster window. `paidDate` set for paid/late.
7. **Leads (~450):** independent funnel over 24 months. Sources: instagram, referral, walk-in, broker, google. ~40% have a `visitDate`; ~20% of visited convert (`converted: true`, `flatsConverted` 1–5). Roles mix (rwa_secretary/resident/builder/other).
8. **Risk scoring (`src/db/queries/risk.ts`):** shared, reusable module.
   - `computeHouseholdRisk(input)` → 0–100 int from: complaints last 90 days (weight × severity, unresolved bonus), late+failed payments last 6 months, SLA misses on their tickets, tenure (newer = slightly higher). Clamp 0–100.
   - `recomputeAllRiskScores(db)` → updates `households.riskScore` for all. Called by the seed at the end (and later by the /customers mutation and optional cron).

## Verification (run after seeding)

- Row counts match volumes (log + spot SQL).
- Pick 3 dispensers: TDS visibly ramps between filter changes and resets after (proves the curve).
- High-infra areas have noticeably more tickets per 100 households than low-infra areas.
- Risk cohort households have high computed `riskScore`; a sample of pre-cancel households scores higher than median (the score must "catch" real churners).
- Monthly revenue trend grows over time (not flat noise).

## Definition of done

- [ ] `bun run db:reset` completes end-to-end with counts logged
- [ ] All 12 tables populated per volumes; no FK violations
- [ ] Risk scores written; cohort sanity check passes
- [ ] `src/db/queries/risk.ts` exported from `src/db/queries/index.ts`
- [ ] check-types green; changes left uncommitted

## Gotchas

- Neon HTTP driver: no long interactive transactions - do truncate → inserts sequentially per stage.
- `date` columns want `YYYY-MM-DD` strings; `timestamp` columns want `Date`.
- Decimal columns (ph, purityPct) accept numbers/strings - keep 1 decimal.
- Keep every generator a pure function taking `(count, ctx)` style params so re-running with a different faker seed stays possible.
