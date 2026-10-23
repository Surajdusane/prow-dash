# Prompt 01 - Docs foundation and shell

Read `docs-prompt/00-readme.md` first.

## Goal

Set up the Fumadocs case-study shell so the rest of the prompts only have to fill pages. Do not write the full page content yet. Create the structure, links, and reusable MDX components.

## Inspect first

Read these files before changing anything:

- `src/lib/source.ts`
- `src/app/(root)/(docs)/layout.tsx`
- `src/app/(root)/(docs)/docs/[[...slug]]/page.tsx`
- `src/features/docs/components/mdx/index.tsx`
- `src/features/docs/components/mdx/headings.tsx`
- `src/lib/layout.shared.tsx`
- `src/content/docs/meta.json`
- `src/content/docs/index.mdx`
- `src/components/global/sidebar/main-menu.tsx`
- `src/components/global/header/hire-me-button.tsx`
- `src/components/ui/button.tsx`
- `package.json`

Check the installed Fumadocs version and the actual `BaseLayoutProps` / `DocsLayout` types before using a prop. Do not guess.

## Task

### 1. Create the content structure

Create the folders and `meta.json` files below. Add placeholder MDX pages with frontmatter only (title + description). The later prompts will fill the bodies.

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

Sidebar order:

1. `index` - Start Here
2. `overview` - Short version, Long version
3. `ideas` - Predictive service demand, Churn risk
4. `routes` - route index + 9 route pages
5. `architecture` - System, Data model, API, Code flow, Data simulation
6. `engineering` - Performance, Quality
7. `about` - About

Use folder `meta.json` titles such as:

- `Overview`
- `The Two Ideas`
- `Route by Route`
- `How It’s Built`
- `Engineering`
- `About`

Delete:

- `src/content/docs/example.mdx`
- `src/content/docs/getting-started/`
- the empty `src/content/docs/components/` folder if it is unused

### 2. Create docs constants

Create `src/features/docs/constants.ts`:

```ts
export const GITHUB_URL = "https://github.com/Surajdusane/prow-dash";
export const GITHUB_REF = "main";
export const LIVE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const CONTACT_URL = "https://github.com/Surajdusane";
```

Notes:

- `CONTACT_URL` is a safe fallback. Replace it with the real email or LinkedIn when the user provides one.
- If the repo is tagged later, change `GITHUB_REF` to the tag.
- Do not hardcode the production URL in every MDX file. Import the constant in components.

### 3. Build the MDX components

Create these in `src/features/docs/components/mdx/`:

#### `SourceLink`

Props:

```ts
type SourceLinkProps = {
  path: string;
  symbol?: string;
  lines?: string; // "12-40"
  label?: string;
  className?: string;
};
```

Behavior:

- Build `${GITHUB_URL}/blob/${GITHUB_REF}/${encodeURI(path)}${lines ? `#L${lines}` : ""}`.
- Render a compact inline link with a small external-link icon.
- `target="_blank"` and `rel="noreferrer"`.
- `aria-label` should include `symbol` when provided.
- Show `label ?? path.split("/").at(-1)`.
- Use `cn` from `@/lib/utils`.

#### `RouteMeta`

Props:

```ts
type RouteMetaProps = {
  live: string;
  time: string;
  repoPath: string;
};
```

Behavior:

- A top-of-page strip with:
  - “Live route” link → `LIVE_URL + live`
  - “Read time” label
  - “Page source” `<SourceLink>`
- Use existing coss/shadcn primitives if they fit, otherwise plain Tailwind.
- Must look good in the docs content column, not full-bleed.

Register all three in `getMDXComponents` in `src/features/docs/components/mdx/index.tsx`. Keep the existing `Accordion`, `Files`, `Steps`, `Tabs` exports. If `Cards`/`Card` are not included by `defaultMdxComponents`, add them from `fumadocs-ui/components/card`.

### 4. Update the docs shell

`src/lib/layout.shared.tsx`:

- Nav title: `ProWater · Case Study`
- Add links:
  - **Live demo** → `LIVE_URL`
  - **GitHub** → `GITHUB_URL`
  - **Hire me** → `CONTACT_URL`
- Add `githubUrl: GITHUB_URL` if the installed `BaseLayoutProps` supports it.
- Keep `themeSwitch: { enabled: false }` because the dashboard is light-only.

`src/app/(root)/(docs)/layout.tsx`:

- With ~20 pages, set `sidebar.collapsible: true` if supported.
- Keep the compact sidebar class.
- Ensure the sidebar is usable on mobile.

### 5. Make the case study discoverable from the dashboard

`src/components/global/sidebar/main-menu.tsx`:

- Add `{ path: "/docs", name: "Case Study", newTab: true }` to the menu items.
- Add `/docs` to the `icons` map with `BookOpen` or `FileText`.
- Make sure `newTab` handling still works.

`src/components/global/header/hire-me-button.tsx`:

- The button currently has no link. Wire it to `CONTACT_URL`.
- Inspect `src/components/ui/button.tsx` for the correct coss/Base UI `asChild` / `render` pattern. Do not guess.
- Keep the existing shine animation.
- Add an accessible label.

### 6. Update the README

Add one line near the top:

```md
> **Case study:** open `/docs` for the recruiter-facing walkthrough - problem, design decisions, route-by-route code maps, and engineering notes.
```

## Verification

Run:

```bash
bun run check-types
bun run build
```

Then start the app and verify:

- `/docs` renders.
- The sidebar shows the new groups.
- `/docs/overview/short` resolves.
- The dashboard sidebar shows “Case Study”.
- The “Hire me” button is a real link.
- No scaffold page (`Example`, `Getting Started`) appears.

## Acceptance criteria

- [ ] All content folders and `meta.json` files exist.
- [ ] Placeholder pages render without errors.
- [ ] `SourceLink` and `RouteMeta` work in MDX.
- [ ] Docs nav has Live demo, GitHub, Hire me.
- [ ] Dashboard sidebar links to `/docs`.
- [ ] “Hire me” has an `href`.
- [ ] Scaffold pages are removed.
- [ ] `bun run build` passes.

Do not commit.
