# Prompt 04 - The two idea deep dives

Read `docs-prompt/00-readme.md` first.

## Goal

Write the two pages that explain the original product ideas:

- `src/content/docs/ideas/predictive-service-demand.mdx`
- `src/content/docs/ideas/churn-risk.mdx`

These are the strongest pages in the case study. They should show how you turn a fuzzy ops problem into a concrete, explainable workflow, and then into code.

Each page starts with a **60-second summary**, then goes deep. A recruiter should be able to stop after the summary; a technical interviewer should be able to keep reading.

## Shared page structure

Use this structure for both:

1. **60-second summary** - 3 short paragraphs or 5 bullets.
2. **Why this exists** - the business cost of not solving it.
3. **Options I considered** - table with `Option | Why it looks attractive | Why I did not choose it`.
4. **What I chose** - the model and the reason.
5. **How it works** - step-by-step, with formulas and thresholds.
6. **The data behind it** - tables, windows, source files.
7. **The UI** - what each surface does and which query feeds it.
8. **Code map** - layer → file → link.
9. **What to watch as a reviewer** - 3 concrete clicks or files.
10. **Trade-offs and limitations** - honest.
11. **What I would do next** - 3 bullets.

## 1. Predictive service demand

File: `src/content/docs/ideas/predictive-service-demand.mdx`

Frontmatter:

```yaml
---
title: Predictive service demand
description: How I turn dispenser telemetry into a ranked next-service queue before customers complain.
---
```

### 60-second summary

- Field service is reactive: a customer complains, then a ticket is raised.
- The dispenser already reports TDS, pH, hardness, and purity. Filter degradation is visible before failure.
- I built a ranked queue of dispensers whose TDS is rising fast or whose filter is overdue, with a human-readable reason for each row.
- It is a transparent heuristic, not ML: linear slope over recent readings + filter age + latest TDS.
- The list is genuinely predictive in the demo because the same simulated timeline that emits repair tickets also produces the readings the queue reads.

### Why this exists

- A failed filter means bad water, a complaint, and a repair visit.
- A proactive filter change is cheaper than an emergency repair and protects retention.
- The ops team cannot watch ~1,000 dispensers manually.
- The dashboard should answer: *which 25 households should we visit next, and why?*

### Options considered

| Option | Why it looks attractive | Why I did not choose it |
|---|---|---|
| Calendar-based maintenance | Simple; every filter changes every N days | Ignores actual water quality and area conditions |
| Fixed TDS threshold | Easy to explain; one number | Fires too late; misses fast-rising TDS below the threshold |
| ML model on telemetry | Could learn complex patterns | No labelled production data; hard to explain; overkill for a demo |
| Slope + filter age + latest TDS | Catches both slow drift and overdue filters; explainable | Needs tuning; linear slope is a simplification |
| **Chosen** | **Composite heuristic** | **Transparent, cheap, testable, good enough to prioritise a queue** |

State clearly that the thresholds are configurable product decisions, not universal truths.

### How it works

Explain the exact query logic from `src/db/queries/service-ops.ts`:

1. Read the last **30 days** of readings.
2. Keep the latest **6 readings per dispenser** using a window function.
3. Compute a linear slope of TDS over time in ppm/day.
4. Convert the slope to **% of latest TDS per week** for display.
5. Compute filter age from `dispensers.last_filter_change_date`.
6. A dispenser is a candidate if:
   - slope ≥ **3.5 ppm/day** and latest TDS ≥ **250**, or
   - filter age ≥ **70 days**.
7. Rank by:

```text
score = latestTds + (slopePpmPerDay × 10) + (filterAgeDays × 2)
```

8. Return the top **25**.

Include a short SQL/TS excerpt, not the whole file. Link to the full query.

### The data behind it

| Data | Table | Window | Why |
|---|---|---|---|
| TDS, purity, hardness, pH | `readings` | last 30 days | The signal |
| Filter age | `dispensers.last_filter_change_date` | current | Overdue maintenance |
| Household / society / area | `households`, `societies`, `areas` | current | Human-readable queue |
| Ticket history | `service_tickets` | 90 days | Area demand context |

Seed link: `src/db/seed/generators/readings.ts` and `src/db/seed/generators/tickets.ts`. Explain that tickets are **emitted by the same TDS timeline**, so the predictive list is not decorative.

### The UI

Live route: `/service-ops`.

Explain each surface:

- **Predictive table** - the action queue. Columns: household, area, filter age, latest TDS, TDS slope, reason. Sorted by the composite score.
- **Area demand** - grouped bar: tickets per 100 households + infrastructure age in the tooltip. Shows where demand concentrates.
- **SLA gauge** - semi-radial: are we resolving within target?
- **Technician workload** - horizontal bar: open load vs 30-day throughput.

Why these visuals:
- Table for an action queue, not a chart.
- Bar for category comparison; horizontal because technician names are long.
- Gauge for a single percentage against a target.
- Area demand uses two series to show volume and density, not just raw counts.

### Code map

| Layer | File | What it does |
|---|---|---|
| Page | `src/app/(root)/(dashboard)/service-ops/page.tsx` | Prefetch + Suspense layout |
| Server prefetch | `src/features/service-ops/server/index.ts` | `batchPrefetchServiceOps` |
| Hook | `src/features/service-ops/hooks/use-get-predictive.ts` | `useSuspenseQuery` |
| Component | `src/features/service-ops/components/predictive-table.tsx` | Ranked queue |
| Router | `src/trpc/routers/service-ops.ts` | `getPredictive` procedure |
| Query | `src/db/queries/service-ops.ts` | `getPredictive` |
| Schema | `src/db/schema.ts` | `readings`, `dispensers`, `service_tickets` |
| Seed | `src/db/seed/generators/readings.ts` | Filter cycle + telemetry |
| Seed | `src/db/seed/generators/tickets.ts` | Causal tickets |

Use `<SourceLink>` for every row.

### What to watch as a reviewer

1. Open `/service-ops`; the predictive table is below the board. Sort by reason and compare the top rows with the area demand chart.
2. Open `src/db/queries/service-ops.ts` and read `getPredictive`; the SQL window function + TS slope are the whole model.
3. Open `src/db/seed/generators/readings.ts` and find where TDS crosses the repair threshold; that is the same curve the queue reads.

### Trade-offs and limitations

- Linear slope is a simplification; a real system would use a damped trend or a small model.
- The 30-day window can miss slow degradation on low-usage dispensers.
- Thresholds are global; a per-area or per-plan baseline would be better.
- No real-time stream; the list is a batch query.
- No cost model for scheduling; it ranks urgency, not route efficiency.
- The data is simulated.

### What I would do next

- Add confidence and estimated days-to-threshold.
- Use area/plan baselines instead of global thresholds.
- Add route optimisation and technician capacity constraints.
- Track whether predicted failures actually happened (precision over time).

## 2. Churn risk

File: `src/content/docs/ideas/churn-risk.mdx`

Frontmatter:

```yaml
---
title: Complaint-based churn risk
description: How I score households with complaints, payment behaviour and SLA misses so support can act before they cancel.
---
```

### 60-second summary

- Churn is usually visible before it happens: complaints cluster, payments go late, service misses stack up.
- I built a transparent 0–100 risk score from four signal groups.
- The score is computed by one shared function used by the seed and by the “Recompute risk” mutation.
- The `/customers` page turns the score into a sortable, filterable action list with a household drawer.
- The seed injects a known risk cohort, so the score can be checked against outcomes instead of being decorative.

### Why this exists

- Reactive retention is expensive: a cancellation is already lost revenue.
- Support needs a ranked list, not a dashboard of charts.
- The reason behind the risk must be explainable to a support agent.
- The score should be cheap to recompute and consistent everywhere.

### Options considered

| Option | Why it looks attractive | Why I did not choose it |
|---|---|---|
| ML classifier | Learns non-linear patterns; can improve with data | No labelled production data; hard to explain; needs monitoring |
| Simple filters (e.g. complaints > 2) | Trivial to implement | Ignores payment and SLA signals; no ranking |
| Rules-based 0–100 score | Explainable, cheap, easy to validate | Weights are hand-tuned; not calibrated probabilities |
| **Chosen** | **Additive score with bands** | **Transparent and actionable; good enough to prioritise support calls** |

### How the score works

From `src/db/queries/risk.ts`:

```text
complaintScore = min(45, complaints90d × 9 + highSeverity90d × 5 + unresolved90d × 5)
paymentScore   = min(45, latePayments6mo × 7 + failedPayments6mo × 11)
slaScore       = min(16, slaMissedTickets12mo × 4)
tenureScore    = 8 if tenure < 90d, 5 if < 180d, 2 if < 365d, else 0

risk = clamp(0, 100, round(complaintScore + paymentScore + slaScore + tenureScore))
```

Bands:

- low: `< 34`
- medium: `34–66`
- high: `≥ 67`

Explain **why** each group is weighted:

- Complaints are the strongest explicit signal; unresolved and high-severity complaints matter more.
- Payment behaviour is the strongest implicit signal; a failed payment is worse than a late one.
- SLA misses capture service frustration that may not appear as a complaint.
- Newer households have less history and slightly higher uncertainty.

### Validation

The seed injects a **~13% risk cohort** with:

- 2–4 complaints inside a bad window
- late/failed payments starting slightly before the window
- ~60% later cancellation

Do not invent precision numbers. Either:

1. Compute them from the seeded database and put the real numbers in the page, or
2. Explain the validation method and state that the numbers are produced by the seed.

If computing, use a query/script that compares:

- high-risk band vs the injected cohort
- top-decile risk vs a random household (lift)
- precision/recall trade-off at the band thresholds

Add a short “How I would validate this” box if the numbers are not available.

### The data behind it

| Signal | Table | Window | Weight |
|---|---|---|---|
| Complaints | `complaints` | 90 days | 45 max |
| High-severity complaints | `complaints` | 90 days | included above |
| Unresolved complaints | `complaints` | 90 days | included above |
| Late payments | `payments` | 6 months | 45 max combined |
| Failed payments | `payments` | 6 months | included above |
| SLA misses | `service_tickets` | 12 months | 16 max |
| Tenure | `households.join_date` | current | 8 max |

Seed links:

- `src/db/seed/generators/households.ts` - risk cohort + cancel logic
- `src/db/seed/generators/complaints.ts` - complaint cluster
- `src/db/seed/generators/payments.ts` - late/failed payments
- `src/db/seed/generators/tickets.ts` - SLA misses

### The UI

Live routes: `/customers`, with the household drawer as the detail state.

Explain each surface:

- **Risk table** - server-paged, sortable, filterable by band, area, status. This is the action list.
- **Risk distribution donut** - the active book split by low/medium/high. Shows whether risk is concentrated.
- **Complaint trend** - multi-line by category over 12 months. Shows whether the problem is water quality, service delay, billing, or device malfunction.
- **Household drawer** - risk ring, subscription, readings sparkline, complaints, payments, tickets. This is the “why” behind the score.
- **Recompute risk** - one-click mutation, used after adding/resolving a complaint.

Why these visuals:
- Table for triage, not a chart.
- Donut for part-to-whole with three bands.
- Multi-line for category trends over time.
- Sparkline for compact telemetry inside a drawer.
- Ring for a single score with band context.

### Code map

| Layer | File | What it does |
|---|---|---|
| Page | `src/app/(root)/(dashboard)/customers/page.tsx` | Prefetch + Suspense layout |
| Server prefetch | `src/features/customers/server/index.ts` | `batchPrefetchCustomers` |
| Hook | `src/features/customers/hooks/use-get-risk-table.ts` | Paged/sorted/filtered table |
| Hook | `src/features/customers/hooks/use-recompute-risk.ts` | Recompute mutation |
| Hook | `src/features/customers/hooks/use-get-household-profile.ts` | Drawer query |
| Component | `src/features/customers/components/risk-table/*` | Risk table |
| Component | `src/features/customers/components/household-drawer/*` | Household drawer |
| Component | `src/features/customers/components/risk-distribution-card.tsx` | Donut |
| Component | `src/features/customers/components/complaint-trend-card.tsx` | Multi-line |
| Router | `src/trpc/routers/customers.ts` | Procedures |
| Query | `src/db/queries/risk.ts` | `computeHouseholdRisk`, `recomputeAllRiskScores` |
| Query | `src/db/queries/customers.ts` | Table/profile queries |
| Seed | `src/db/seed/generators/households.ts` | Risk cohort |
| Seed | `src/db/seed/generators/complaints.ts` | Complaint clusters |

### What to watch as a reviewer

1. Open `/customers`, filter to high risk, and open the first household. The drawer should show the evidence behind the score.
2. Open `src/db/queries/risk.ts`; the whole scoring model is one readable function.
3. Add a complaint to a household, resolve it, then recompute risk and watch the score change.

### Trade-offs and limitations

- Hand-tuned weights, not a calibrated model.
- The score is a ranking tool, not a probability of churn.
- The seed cohort is synthetic; real validation needs real outcomes.
- The score uses fixed windows (90d/6mo/12mo) that may not fit every business.
- No causal claim: complaints correlate with churn, but the demo does not prove causation.
- No per-plan or per-area calibration.

### What I would do next

- Calibrate weights against real cancellation data.
- Add precision/recall monitoring and a review queue for borderline scores.
- Separate “risk of churn” from “risk of dissatisfaction”.
- Add suggested actions (call, discount, free filter change) based on the dominant signal.
- Add a time-series of risk score per household.

## Writing checks

- Each page has a 60-second summary before any deep detail.
- Every formula matches `src/db/queries/risk.ts` or `src/db/queries/service-ops.ts`.
- The words “ML” and “AI” are not used to describe the implementation.
- The simulated-data disclaimer is present.
- Every code map row links to a real file.
- No invented validation numbers.

## Acceptance criteria

- [ ] Both pages render.
- [ ] Both start with a 60-second summary.
- [ ] Both include options, decision, trade-off, data, UI, code map, limitations.
- [ ] Predictive thresholds and risk weights match the code.
- [ ] Validation is either real or clearly marked as a method, not fabricated.
- [ ] `bun run build` passes.
