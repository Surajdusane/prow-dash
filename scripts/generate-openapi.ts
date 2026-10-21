/**
 * Generates the OpenAPI 3.1 document for the tRPC app router.
 *
 * The spec is written to `public/openapi.json`, so it is served at
 * `/openapi.json` by Next.js and can be consumed by Postman, Insomnia,
 * client generators (Hey API, openapi-typescript, ...) and AI agents.
 *
 * Usage: `bun run openapi:generate`
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { generateOpenAPIDocument } from "@trpc/openapi";

const ROUTER_FILE = path.resolve("src/trpc/routers/_app.ts");
const OUTPUT_FILE = path.resolve("public/openapi.json");

/**
 * Base URL every generated path is relative to. The tRPC HTTP endpoint is
 * mounted at `/api/trpc`, so a relative default keeps the same document valid
 * in local development and in production. Override when the API is served from
 * a different origin (e.g. `OPENAPI_SERVER_URL=https://api.example.com/api/trpc`).
 */
const SERVER_URL = process.env.OPENAPI_SERVER_URL?.trim() || "/api/trpc";

async function main() {
  const document = await generateOpenAPIDocument(ROUTER_FILE, {
    exportName: "AppRouter",
    title: "ProWater Ops API",
    version: process.env.npm_package_version ?? "0.1.0",
    servers: [{ url: SERVER_URL }],
  });

  mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, `${JSON.stringify(document, null, 2)}\n`, "utf8");

  const operationCount = Object.keys(document.paths ?? {}).length;
  console.log(
    `OpenAPI document written to ${path.relative(process.cwd(), OUTPUT_FILE)} (${operationCount} operations)`
  );
}

void main();
