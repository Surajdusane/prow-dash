# Prompt 12 — QA, build, and launch

Read `docs-prompt/00-readme.md` first.

## Goal

Do the final pass that turns a collection of good pages into a trustworthy case study:

- every page exists and is in the right sidebar order
- every link works
- every code link points to a real file
- the build passes
- the docs work on mobile
- the demo is deployed or the local-run instructions are clear
- no fake claims, TODOs, or scaffold pages remain

Do not add new features in this phase. Fix, verify, and polish.

## 1. Content completeness

Check each file exists and has frontmatter:

```text
src/content/docs/index.mdx
src/content/docs/overview/short.mdx
src/content/docs/overview/long.mdx
src/content/docs/ideas/predictive-service-demand.mdx
src/content/docs/ideas/churn-risk.mdx
src/content/docs/routes/index.mdx
src/content/docs/routes/overview.mdx
src/content/docs/routes/service-ops.mdx
src/content/docs/routes/customers.mdx
src/content/docs/routes/devices.mdx
src/content/docs/routes/fleet.mdx
src/content/docs/routes/revenue.mdx
src/content/docs/routes/societies.mdx
src/content/docs/routes/leads.mdx
src/content/docs/routes/sustainability.mdx
src/content/docs/architecture/system.mdx
src/content/docs/architecture/data-model.mdx
src/content/docs/architecture/api.mdx
src/content/docs/architecture/code-flow.mdx
src/content/docs/architecture/data-simulation.mdx
src/content/docs/engineering/performance.mdx
src/content/docs/engineering/quality.mdx
src/content/docs/about.mdx
```

For each page:

- `title` is specific, not “Page 1”.
- `description` is one sentence and explains the value.
- The page starts with the business question, not “This page…”.
- Every technical claim has a code link.
- No placeholder text, no `TODO`, no `Lorem ipsum`.
- No duplicated page (e.g. short and long should not be identical).
- Word limits respected:
  - home ≤ 900
  - short ≤ 1,200
  - long ≤ 4,500
  - idea ≤ 2,000
  - route ≤ 1,500
  - architecture/engineering ≤ 2,000

Search for leftovers:

```bash
rg -n "TODO|TBD|Lorem ipsum|example\.com|placeholder" src/content/docs
```

Fix everything. If a value is genuinely unknown (email, live URL), make it explicit and use the GitHub fallback — do not leave a fake address.

## 2. Sidebar order and navigation

Open `src/content/docs/meta.json` and each folder `meta.json`.

Expected order:

1. Start Here
2. Overview — Short version, Full case study
3. The Two Ideas — Predictive service demand, Churn risk
4. Route by Route — index + 9 routes
5. How It’s Built — System, Data model, API, Code flow, Data simulation
6. Engineering — Performance, Quality
7. About

Verify:

- No `example` or `getting-started` page appears.
- The route group lists `/` before `/service-ops`, then `/customers`, `/devices`, `/devices/fleet`, `/revenue`, `/societies`, `/leads`, `/sustainability`.
- The folder titles match the copy.
- The docs nav has Live demo, GitHub, Hire me.
- The dashboard sidebar has “Case Study” → `/docs`.
- The “Hire me” button has a real `href`.

## 3. Link integrity

### Internal docs links

Start the app:

```bash
bun run dev
```

Check the main routes:

```bash
for path in /docs /docs/overview/short /docs/overview/long \
  /docs/ideas/predictive-service-demand /docs/ideas/churn-risk \
  /docs/routes /docs/routes/overview /docs/routes/service-ops \
  /docs/routes/customers /docs/routes/devices /docs/routes/fleet \
  /docs/routes/revenue /docs/routes/societies /docs/routes/leads \
  /docs/routes/sustainability /docs/architecture/system \
  /docs/architecture/data-model /docs/architecture/api \
  /docs/architecture/code-flow /docs/architecture/data-simulation \
  /docs/engineering/performance /docs/engineering/quality /docs/about; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$path")
  echo "$code $path"
done
```

Every line must be `200`.

### SourceLink paths

Every `<SourceLink path="...">` must point to a real file. Extract them and check:

```bash
rg -o 'path="[^"]+"' src/content/docs | sed 's/.*path="//; s/"$//' | sort -u | while read -r file; do
  if [ -f "$file" ]; then echo "OK   $file"; else echo "MISS $file"; fi
done
```

Fix every `MISS`.

### External links

- GitHub repo: `https://github.com/Surajdusane/prow-dash`
- Live demo: `LIVE_URL`
- Contact: `CONTACT_URL`
- Any docs link to `/api-docs` or `/openapi.json`

Check with:

```bash
curl -I https://github.com/Surajdusane/prow-dash
```

If the repo is private, make it public or remove the link. A dead GitHub link destroys trust.

### Optional automated crawl

If available:

```bash
bunx --bun linkinator http://localhost:3000/docs --recurse --skip "github.com|linkedin.com|mailto:"
```

Fix all internal 404s. External 403s from LinkedIn are normal.

## 4. Data accuracy

Re-read the claims against the code:

- Predictive thresholds: `3.5 ppm/day`, `250` TDS, `70` days, top `25`, score `latestTds + slope*10 + age*2`.
- Risk weights: complaints 45 max, payments 45 max, SLA 16 max, tenure 8 max.
- Risk bands: `< 34`, `34–66`, `>= 67`.
- Risk cohort: `13%`, `60%` cancellation.
- Plans: ₹499 / ₹799 / ₹1,199.
- SLA: 48 / 72 / 96 / 120 hours.
- Jar size: 20 L.
- Plan litres/day: 8 / 12 / 18.
- Volumes: 8 areas, 50 societies, ~1,150 households, ~1,000 dispensers, ~250k readings, ~7k tickets, ~2.5k complaints, ~25k payments, 450 leads, 12 technicians.

If a number is wrong, fix it in the docs; do not change the code to match the docs.

Check that every page says the data is simulated. At minimum: home, long version, data simulation, About.

## 5. No visual assets

Verify:

- There are no screenshot or diagram files under `public/docs/`.
- No MDX page uses an image component or an `<img>` tag.
- The route pages use prose, tables, and `<SourceLink>` code references instead.

## 6. Layout QA

Open every docs page at desktop and mobile widths.

Check:

- The hero is not a wall of text.
- Code links do not overflow.
- Tables scroll horizontally on mobile instead of breaking the layout.
- The sidebar is usable on mobile.
- The table of contents does not overlap content.
- Dark mode is disabled; the docs are light-only by design.
- The docs nav links are visible and not crowded.
- The “Hire me” CTA is visible but not obnoxious.

## 7. Accessibility QA

- Every icon-only link/button has an `aria-label`.
- Headings are hierarchical (`h1` once per page, then `h2`/`h3`).
- Tables have headers.
- Color is not the only way risk bands are conveyed.
- Keyboard: can you reach the docs nav, search, and links?
- Focus states are visible.
- The docs search works (`Ctrl+K` / `⌘K`).

## 8. Performance QA

Open DevTools → Network on `/service-ops` and `/customers`.

- The page should make one document request with hydrated data, not a client-side fetch waterfall.
- If a refetch or mutation happens, `httpBatchLink` batches the tRPC calls into one request.
- No client `fetch` in `useEffect`.
- No full-table payload on the risk/fleet table.
- Charts render within a reasonable time; no layout shift.
- The docs bundle should not include dashboard-only chart code.

Open DevTools → React Profiler and drag a kanban card. Only the affected cards should re-render. If the whole board re-renders, note it as a known issue; do not rewrite the board in the QA phase.

## 9. Build and type checks

Run:

```bash
bun run check-types
bun run lint
bun run format:check
bun run build
```

All must pass.

- `bun run build` runs `openapi:generate` first. Confirm `public/openapi.json` is regenerated and valid.
- The build must not require a database connection.
- If the build fails on a docs page, read the MDX error and fix the component or frontmatter.
- Re-run `bun run build` after fixes.

## 10. README and repo hygiene

Update `README.md`:

- Add the case-study link near the top:
  ```md
  > **Case study:** open `/docs` for the recruiter-facing walkthrough.
  ```
- If deployed, replace “the live deployment is not part of this repo snapshot” with the real URL.
- Keep the existing architecture, seed, and route sections; they are still accurate.

Repo hygiene:

- No `.env` committed.
- No database dumps.
- No `node_modules` changes.
- No generated screenshot or diagram assets in the repo.
- `public/openapi.json` is committed if the repo already tracks it; otherwise leave it as the build output.
- `docs-prompt/` can stay in the repo; it is not linked from the docs site.
- Do not commit unless the user explicitly asks.

## 11. Deployment (only if the user wants a live demo)

Intended stack: Vercel + Neon.

1. Create a Neon project and copy the **pooled** connection string.
2. Set `DATABASE_URL` in Vercel.
3. Set `NEXT_PUBLIC_APP_URL` to the production origin.
4. Run migrations and seed against the production database from your machine:
   ```bash
   bun run db:migrate
   bun run db:reset
   ```
5. Deploy.
6. Open the live routes and verify:
   - `/` loads
   - `/service-ops` kanban drag persists
   - `/customers` drawer opens
   - `/revenue` mark paid works
   - `/docs` loads
   - `/api-docs` loads
7. Update `LIVE_URL` / `NEXT_PUBLIC_APP_URL`.

Known trade-off: Neon cold starts add roughly a second to the first query after idle. Say so in the docs instead of hiding it.

If the user does not want to deploy, say clearly in the docs: “Run locally with `bun run dev`; the repo is deployment-ready but no public demo is included.”

## 12. Version pinning (optional, only with user approval)

If the user wants stable code links:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then set in `src/features/docs/constants.ts`:

```ts
export const GITHUB_REF = "v1.0.0";
```

Re-run the build and click three `SourceLink`s to confirm they resolve to the tag.

Do not create a tag or push without explicit approval.

## 13. Final definition of done

- [ ] A recruiter can land on `/docs`, understand the project in 2 minutes, reach the two ideas, open a live route, and click into code.
- [ ] The short page is ≤ 1,200 words.
- [ ] The long page is ≤ 4,500 words.
- [ ] Every route page has a chart/data/code table and a code map.
- [ ] Every route page explains the seed logic and why the chart is the right visual.
- [ ] The two idea pages have a 60-second summary, formulas, validation, and limitations.
- [ ] The architecture pages explain the system, schema, API, and code flow.
- [ ] The data-simulation page explains the ten stages and the exact formulas.
- [ ] The engineering pages are honest about performance costs and the missing test suite.
- [ ] The About page has real contact details (or a clear GitHub fallback).
- [ ] No scaffold pages remain.
- [ ] No broken internal links.
- [ ] No broken GitHub file links.
- [ ] No fake claims about auth, real customers, ML, or production scale.
- [ ] `bun run check-types`, `bun run lint`, `bun run format:check`, and `bun run build` pass.
- [ ] The docs work on mobile.
- [ ] The dashboard sidebar links to `/docs`.
- [ ] The “Hire me” button works.

Do not commit. Leave the working tree for the user to review.
