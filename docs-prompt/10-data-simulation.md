# Prompt 10 - Data simulation

Read `docs-prompt/00-readme.md` first.

## Goal

Write `src/content/docs/architecture/data-simulation.mdx`.

This page is one of the strongest pieces of evidence in the case study. It shows that the insights are not random rows - the patterns the dashboard claims to detect are injected upstream, deterministically.

The page must answer:

1. Why simulate data at all?
2. How is the dataset generated?
3. Which patterns are injected, and where?
4. What are the exact formulas and thresholds?
5. How is the result validated?
6. What are the limitations?

## Frontmatter

```yaml
---
title: Simulating 24 months of causal data
description: A deterministic ten-stage seed that injects filter degradation, seasonal complaints, payment drift and a known risk cohort - so the dashboard's insights are real to the dataset.
---
```

## Required sections

### 1. Why simulate

- A dashboard built on random rows proves layout, not logic.
- A predictive queue is only credible if the same timeline that creates failures also creates the telemetry the queue reads.
- Real IoT data is not available; synthetic data lets the project be honest and reproducible.
- The goal is **internal consistency**, not realism for its own sake:
  - a filter that degrades produces rising TDS
  - rising TDS produces a repair ticket
  - complaints cluster where service fails
  - late payments precede cancellation
  - cancellations reduce MRR and impact

State clearly: this is a simulation, not real customer data.

### 2. Determinism

- `faker.seed(42)`.
- A 24-month window anchored to the day the seed runs.
- `MONTHS_OF_HISTORY = 24`.
- `historyWindowStart(today)` starts at the first day of the month 23 months ago, so there are 24 month buckets including the current one.
- Re-running on a different day shifts the window; the *patterns* stay the same, the dates move.
- `bun run db:seed` only runs on an empty database.
- `bun run db:reset` truncates all 12 tables with `RESTART IDENTITY CASCADE` and reseeds.
- The seed is not idempotent by design: it refuses to append to a populated database.

### 3. The ten stages

Read `src/db/seed/index.ts` and describe each stage with its output:

| Stage | What it creates | Key file |
|---|---|---|
| 1. Reference data | 8 areas, 3 plans, 12 technicians | `src/db/seed/reference.ts` |
| 2. Societies | 50 societies in onboarding waves | `src/db/seed/generators/societies.ts` |
| 3. Households | ~1,150 households, status, plan, risk cohort | `src/db/seed/generators/households.ts` |
| 4. Subscriptions | One subscription per household | `src/db/seed/generators/households.ts` |
| 5. Dispensers | One dispenser per household + simulated life | `src/db/seed/generators/dispensers.ts`, `readings.ts` |
| 6. Readings + tickets | ~250k readings and causal service tickets | `src/db/seed/generators/readings.ts`, `tickets.ts` |
| 7. Complaints | Seasonal complaints + risk-cohort clusters | `src/db/seed/generators/complaints.ts` |
| 8. Payments | One payment per subscription-month | `src/db/seed/generators/payments.ts` |
| 9. Leads | 450 leads over 24 months | `src/db/seed/generators/leads.ts` |
| 10. Risk scores | Recompute every household with the shared function | `src/db/queries/risk.ts` |

Explain the causal links between stages in prose.

### 4. Injected patterns

Use a table:

| Pattern | How it is injected | Where it shows up |
|---|---|---|
| Area imbalance | `infrastructureAgeYears` drives drift speed | `/service-ops` area demand, `/societies` penetration |
| Filter degradation | Convex TDS curve per filter cycle | `/devices` telemetry, `/service-ops` predictive queue |
| Causal tickets | Repair/filter tickets emitted from the same curve | `/service-ops` board + demand |
| Seasonality | Monsoon/summer multipliers | `/customers` complaint trend, `/devices` hardness |
| Risk cohort | ~13% of households get a bad window | `/customers` risk table |
| Growth curve | Societies onboard in waves over 14 months | `/societies` growth, `/` household growth |
| Plan mix shift | Starter → standard/premium over time | `/revenue` plan mix, `/` plan donut |
| Technician imbalance | Load weights per technician | `/service-ops` workload |
| Sales funnel | 40% visits, 22% of visitors convert | `/leads` funnel + source conversion |
| Payment drift | Risk cohort late/failed months precede complaints | `/revenue` payment outcomes, `/customers` risk |

Explain each in 2–4 sentences. Do not just list them.

### 5. The exact formulas

This is the section a technical reviewer will read closely. Include the real formulas from `src/db/seed/patterns.ts` and `src/db/seed/generators/readings.ts`.

#### Filter cycle

- Each cycle lasts `randInt(60, 75)` days.
- Baseline TDS: `105–140 ppm`.
- Ceiling TDS:
  - high-infra areas (`>= 9.5 years`): `480–560 ppm`
  - other areas: `385–470 ppm`
- Drift speed:

```text
speed = infraDriftFactor(age) × seasonalityMultiplier(midDate) × planIntensity × jitter(0.94–1.06)
```

- `infraDriftFactor(age) = 1 + max(0, age - 4) × 0.035`
- `seasonalityMultiplier`: monsoon (Jun–Oct) `1.25`, summer (Mar–May) `1.12`, else `1`
- `planIntensity`: starter `0.95`, standard `1.00`, premium `1.08`

#### TDS curve

```text
projectTds(progress, baseline, ceiling) =
  baseline + (ceiling - baseline) × clamp(progress, 0, 1.08) ^ 1.12
```

- Convex, so the last weeks accelerate.
- `progress` can exceed 1 when a repair takes longer than the natural cycle.

#### Purity and hardness

```text
purity = clamp(97.5 - (tds - 110) × 0.0305, 82, 98.5)
hardness = (baseline + (ceiling - baseline) × progress ^ 1.1) × monsoonBoost
```

- Monsoon hardness boost: `1.12`.
- Readings add small noise: TDS ±5, purity ±0.4, hardness ±7.

#### Telemetry cadence

- Every 2–3 days.
- Random time between 06:00 and 22:00.
- Stops at `readingEnd`, which is the cancel date for cancelled households, or the offline date for devices that are offline.
- Offline share: 4% (`ONLINE_SHARE = 0.96`).
- Offline devices stop reporting 9–75 days before today.

#### Repairs and filter changes

- Repair threshold: TDS `>= 500 ppm` (and the code also tracks purity `< 85` as a threshold constant).
- The seed analytically finds the day the TDS curve crosses 500 within the cycle.
- If the crossing happens at least 5 days after the start and at least 4 days before the scheduled end, it becomes a `repair` ticket.
- Otherwise, the cycle ends with a scheduled `filter_change` ticket.
- 4% chance of a hardware fault repair in any area.
- `installation` for ~70% of households.
- `inspection` on ~6% of cycles.
- Resolution times:
  - repair: 3–68h (SLA 48h)
  - filter change: 6–96h (SLA 72h)
  - inspection: 6–136h (SLA 96h)
  - installation: 8–148h (SLA 120h)

#### Complaints

- Normal household: `Poisson(1.75)` complaints across its active life.
- Risk cohort: 2–4 complaints inside the injected bad window.
- Seasonal weights: monsoon `1.45`, post-monsoon `1.35`, summer `1.1`, otherwise `1`.
- Categories:
  - monsoon: water quality 42, device malfunction 28, billing 13, service delay 16, other 6
  - post-monsoon: service delay 30
- Severity:
  - risk cohort: low 25%, medium 45%, high 30%
  - normal: low 50%, medium 35%, high 15%
- Complaints older than 10 days are resolved; recent ones are 45% resolved.

#### Payments

- One row per active subscription-month.
- Normal month: paid 88%, late 8%, failed 4%.
- Current month: paid 58%, late 5%, failed 4%, pending 33%.
- Risk-cohort month: paid 20%, late 50%, failed 30%.
- The bad payment window starts one month before the complaint cluster.

#### Risk cohort

- `RISK_COHORT_SHARE = 0.13`.
- `COHORT_CANCEL_SHARE = 0.6`.
- `BASE_CHURN_SHARE = 0.08`.
- Recent joiners: `0.07`.
- The cohort window is skewed toward the recent past, so current risk scores have something to react to.

#### Growth and plan mix

- 50 societies in onboarding waves over months 1–14.
- Wave weights: `[6, 6, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 1]`.
- Area allocation: `[6, 8, 6, 5, 6, 7, 7, 5]`.
- Each society has 80–400 flats.
- 78% of households join shortly after the society onboards; the rest trickle in later.
- Plan mix shifts from starter-heavy to standard/premium:
  - starter share: 0.45 → 0.12 over 23 months
  - premium share: 0.08 → 0.35
  - standard is the remainder

#### Leads

- 450 leads, skewed toward recent months.
- Sources: Instagram 32, referral 22, Google 20, walk-in 13, broker 13.
- 40% book a visit.
- 22% of visitors convert.
- Converted leads bring 1–5 flats.
- Roles: resident 45, RWA secretary 20, builder 20, other 15.

### 6. Volumes and insert strategy

Table:

| Table | Approx rows | Why |
|---|---:|---|
| areas | 8 | Reference |
| plans | 3 | Reference |
| technicians | 12 | Reference |
| societies | 50 | Reference/growth |
| households | ~1,150 | The book |
| subscriptions | ~1,150 | One per household |
| dispensers | ~1,000 | One per household |
| readings | ~250,000 | 24 months × ~2.5/week |
| service_tickets | ~7,000 | Causal |
| complaints | ~2,500 | Seasonal + cohort |
| payments | ~25,000 | Monthly billing |
| leads | 450 | Sales |

Explain:

- Readings are buffered and inserted in chunks of 1,000 to stay under Neon HTTP parameter limits.
- Tickets/complaints/payments/leads use `insertInChunks` with the same chunk size.
- Risk scores update in chunks of 400.
- The seed logs progress because it takes a minute or two.
- The build does not need a database; all dashboard pages are `force-dynamic`.

### 7. Validation

Do not invent precision numbers. Explain how to validate:

1. **Cohort check** - compare the high-risk band with the injected `riskCohort` flag. If the score is working, the high band should be enriched for the cohort.
2. **Outcome check** - compare high-risk households with later cancellation. The cohort has ~60% cancellation, so a useful score should rank cohort households above the base rate.
3. **Lift** - top-decile risk vs a random household.
4. **Precision/recall at band thresholds** - high band precision and recall, with the caveat that the score is a ranking tool, not a classifier.
5. **Predictive service check** - for dispensers in the predictive queue, did a repair/filter ticket follow within the next N days? The seed’s causal timeline makes this measurable.
6. **Visual sanity** - high-infra areas should have higher tickets per 100; monsoon months should have more water-quality complaints; plan mix should shift over time.

Include a short code/SQL sketch, e.g.:

```sql
-- high-risk band vs injected cohort is not stored as a flag in the DB,
-- so validation is done by re-running the seed-time cohort list or by
-- comparing risk bands against cancellation outcomes.
select
  case
    when risk_score >= 67 then 'high'
    when risk_score >= 34 then 'medium'
    else 'low'
  end as band,
  count(*) as households,
  count(*) filter (where status = 'cancelled') as cancelled
from households
group by 1
order by 1;
```

If you run this against the seeded DB, put the real numbers in the page. If you do not, write “the query is the validation method; the numbers depend on the seed date” - do not fabricate.

### 8. Limitations

Be explicit:

- Synthetic data, not real customers or IoT.
- The cohort is injected, so validation is partly circular. It proves the score can recover a known signal; it does not prove the score predicts real churn.
- The TDS curve is a simplification of membrane chemistry.
- No real weather, water source, or building plumbing data.
- The 24-month window shifts with the run date, so absolute counts vary slightly.
- Faker seed 42 makes the run deterministic for a given date, not across dates.
- No real-time ingestion.
- No multi-tenant data.
- The simulation does not model price changes, plan upgrades, or household moves.

### 9. What I would change for production

- Ingest real telemetry (MQTT/HTTP) and store raw + cleaned readings.
- Add a data quality layer: late readings, outliers, device clock drift.
- Calibrate filter cycles per device model and water source.
- Replace the injected cohort with real outcomes and a proper train/validation split.
- Add a monthly snapshot table for MRR/retention at scale.
- Add lineage and a seed version so the dataset is reproducible across environments.

## Code links

Use `<SourceLink>` for:

- `src/db/seed/index.ts`
- `src/db/seed/patterns.ts`
- `src/db/seed/reference.ts`
- `src/db/seed/generators/societies.ts`
- `src/db/seed/generators/households.ts`
- `src/db/seed/generators/dispensers.ts`
- `src/db/seed/generators/readings.ts`
- `src/db/seed/generators/tickets.ts`
- `src/db/seed/generators/complaints.ts`
- `src/db/seed/generators/payments.ts`
- `src/db/seed/generators/leads.ts`
- `src/db/queries/risk.ts`
- `package.json` scripts

## Acceptance criteria

- [ ] The page explains why the simulation exists before how it works.
- [ ] All ten stages are listed.
- [ ] The formulas match the code.
- [ ] The validation section does not fabricate numbers.
- [ ] The limitations are honest and specific.
- [ ] `bun run build` passes.

Do not commit.
