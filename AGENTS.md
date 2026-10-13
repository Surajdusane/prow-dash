<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Git
- Never create branches, worktrees, or commits automatically. Only do so when the user explicitly asks for that specific action in the current request.
- Leave changes uncommitted in the working tree on the current branch and let the user decide when and how to commit.

## Docs (Fumadocs)
- Content lives in `src/content/docs` (`.mdx` + `meta.json` for sidebar order; subfolders become sidebar groups).
- MDX components (headings, Tabs, Steps, etc.) in `src/features/docs/components/mdx`; code theme (min-light/vesper) in `source.config.ts`; code-block height cap in `globals.css` (`figure.shiki > div[role="region"]`).
- Docs shell: `src/app/(docs)/layout.tsx` + shared options in `src/lib/layout.shared.tsx`; `RootProvider` stays in `src/app/layout.tsx` — don't nest another one.
- After adding pages, run `bun run build` to verify prerender.

### Add a docs page
1. Create `src/content/docs/<name>.mdx` with `title` (+ `description`) frontmatter.
2. Add `"<name>"` to `pages` in `src/content/docs/meta.json` (names match files without `.mdx`).
3. For a group: create subfolder with its own `meta.json` (`title` + `pages`), then list the folder name in the parent `meta.json`.