<!-- intent-skills:start -->
## Skill Loading

Use the repository’s installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before editing files for a substantial task:
- Run `bunx --no-install --package @tanstack/intent intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `bunx --no-install --package @tanstack/intent intent load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

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

You are an expert saas engineer helping build a production-quality and scalable SaaS app. You write clean, simple, maintainable code. You should think like a senior saas developer.

<!-- BEGIN:nextjs-agent-rules -->

## What we're building

A **link-in-bio tool for ecommerce stores**. A merchant creates one page
(a "link"), pastes it into their Instagram bio, and visitors land on a fast
mobile page showing their products in a searchable 2-column grid. Clicking a
product goes to the merchant's actual store (Shopify, etc).

## precautions
- use stictly trpc
- use features folder for all the features
- dont fetch data directly to the client page
- all import should be from `@/` not "../`
- use toast for all the error and success messages
    example., import { toastManager } from "@/components/ui/toast";
    toastManager.add({
            title: "short title",
            description: "short but meanigful description",
            type: "success" | "error" | "info" | "warning",
          });
- use use-confirm hook for all the confirmation dialog. import {ConfirmationDialog, confirm} from "@/hooks/use-confirm";
- use `src\lib\auth-utils.ts` on every page to protect page

## Styling rules 
- use tailwindcss
- use coss skills and shadcn skills for implimenting already install components or you can install required components use this following example `bunx --bun shadcn@latest add @coss/button` if required component not found.
- also use evils chart for all the charts with shadcn

## How to impliment features
- create a feature folder
    Example structure
    features/links/components
    features/links/hooks
    features/links/schema
    features/links/server
    features/links/store
    features/links/utils
    features/links/types
    features/links/index.ts (exports all the components, hooks, schema, server, store, utils, types)

1. if components are contain multiple compoent then create a folder for those component in componet folder and inside it create index.ts file and export all the components example features/links/components/header/index.tsx, features/links/components/header/profile-button.tsx, features/links/components/header/userr-diloge.tsx

2. for every data mutation and query create a hook in the hook folder and export it example features/links/hooks/use-create-link.ts, features/links/hooks/use-get-links.ts and this use strictly trpc and use toast to show error and success messages
example code., 
```ts
// this is just example code this is not real implimentation and if hook required input then pass it as a param
"use client";

// Hook to featch all workfolws using suspese
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";

import { useTRPC } from "@/trpc/client";

export const useGetLinks = () => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.links.getMany.queryOptions());
};

export const useCreateLink = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation(
    trpc.workflow.create.mutationOptions({
      onSuccess: ([data]) => {
        toastManager.add({
            title: "Link created successfully",
            description: "description",
            type: "success",
          });
        // router.push(`/workflows/${data.id}`);
        queryClient.invalidateQueries(trpc.links.getMany.queryOptions());
      },
      onError: (err) => {
        toastManager.add({
            title: "Error while creating link",
            description: "exact error description",
            type: "error",
          });
      },
    })
  );
};
```

3. every data use zod schema for validation and create a schema folder and inside it create index.ts file and export all the zod schemas example features/links/schema/index.ts, features/links/schema/create-link.ts, features/links/schema/update-link.ts

4. this include all server side code, mostly for data fetching use followig code to fetch data from server
```ts
import { prefetch, trpc } from "@/trpc/server";

export const prefetchLinks = () => {
  return prefetch(trpc.links.getMany.queryOptions());
};
```
use prefetch and batchPrefetch to prefetch data as per need
```ts
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(queryOptions: T) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") {
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}

export function batchPrefetch<T extends ReturnType<TRPCQueryOptions<any>>>(queryOptionsArray: T[]) {
  const queryClient = getQueryClient();

  for (const queryOptions of queryOptionsArray) {
    if (queryOptions.queryKey[1]?.type === "infinite") {
      void queryClient.prefetchInfiniteQuery(queryOptions as any);
    } else {
      void queryClient.prefetchQuery(queryOptions);
    }
  }
}
```
when every time prefetch data then use this workflow example
for server side prefetch data
```tsx
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import ClientComponent from "./_client";

const page = async () => {
  prefetch(trpc.test.queryOptions());
  return (
    <HydrateClient>
      <ErrorBoundary fallback={<div>Error</div>}>
        <Suspense fallback={<div>Loading...</div>}>
          <ClientComponent />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default page;
```
for client side prefetch data
```tsx
"use client"

import { useTRPC } from "@/trpc/client"
import { useSuspenseQuery } from "@tanstack/react-query"

const ClientComponent = () => {
    const trpc = useTRPC()
    const { data } = useSuspenseQuery(trpc.test.queryOptions())
  return (
    <div>
        {JSON.stringify(data)}
    </div>
  )
}

export default ClientComponent
```
but insted of direct fetching create a hook and call it in client side component and use server foder prefetch data code in server side component

5. if there is any need for global state then use store for create zustand store and use it in all the components but in the most case you can use tenstack query for global state use this for worst case

6. add utils folder and create a file and add all the common function and use it in all the components create index.ts file and export all the functions


## How to create api with trpc

# first Create schema in `src/trpc/schema`
- create zod schema for every data query and mutation
- also export this zod shema as a type
```ts
import { z } from "zod";

export const createLinkSchema = z.object({
  name: z.string(),
  description: z.string(),
  url: z.string(),
  image: z.string(),
});

export type CreateLinkSchema = z.infer<typeof createLinkSchema>;
```
- export all schema in `src/trpc/schema/index.ts`

# second Create db query and mutation in `src/db/queries`

- create query for every data query and mutation
```ts
import type { Database } from "@/db";
export const getDocumentById = async (db: DatabaseType, data: getDocumentByIdParams) => {
  const { id, userId } = data;
  const [result] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)));

  return result;
};

export const updateDocument = async (db: Database, data: UpdateDocumentParams) => {
  const { id, userId, ...updateData } = data;

  const [result] = await db
    .update(documents)
    .set(updateData)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    .returning();

  return result;
};
```

## third Create trpc router in `src/trpc/routers`
```ts
import { generateSlug } from "random-word-slugs";

import {
  createWorkflow,
  getAllWorkflows,
  getWorkflowByWorkflowId,
  removeWorkflow,
  updateWorkflowName,
} from "@/db/queries";

import { createTRPCRouter } from "../init";
import { authorizedProcedure } from "../procedures/authorizedProcedure";
import { getWorkflowByWorkflowIdSchema, removeWorkflowSchema, updateWorkflowNameSchema } from "../schemas/workflow";

export const workflowRouter = createTRPCRouter({
  create: authorizedProcedure.mutation(async ({ ctx: { db, userId } }) => {
    return await createWorkflow(db, {
      name: generateSlug(3),
      userId: userId,
    });
  }),
  remove: authorizedProcedure.input(removeWorkflowSchema).mutation(async ({ ctx: { db, userId }, input }) => {
    return await removeWorkflow(db, {
      workflowId: input.workflowId,
      userId: userId,
    });
  }),
  updateName: authorizedProcedure.input(updateWorkflowNameSchema).mutation(async ({ ctx: { db, userId }, input }) => {
    return await updateWorkflowName(db, {
      name: input.name,
      userId: userId,
      workflowId: input.workflowId,
    });
  }),
  getById: authorizedProcedure.input(getWorkflowByWorkflowIdSchema).query(async ({ ctx: { db, userId }, input }) => {
    return await getWorkflowByWorkflowId(db, {
      workflowId: input.workflowId,
      userId: userId,
    });
  }),
  getMany: authorizedProcedure.query(async ({ ctx: { db, userId } }) => {
    return await getAllWorkflows(db, userId);
  }),
});
```
- export all router in `src/trpc/routers/_app.ts`
```ts
export const appRouter = createTRPCRouter({
  user: userRouter,
  workflow: workflowRouter,
});
```