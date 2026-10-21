import { ApiReference } from "@scalar/nextjs-api-reference";

/**
 * Interactive API reference for the tRPC router.
 *
 * Rendered as a standalone HTML document (outside the dashboard shell) so
 * Scalar's own sidebar is not nested inside the app sidebar. The reference
 * reads the generated spec from `/openapi.json`.
 *
 * The API uses the SuperJSON transformer, so the hooks below translate between
 * Scalar's plain-JSON view and the tRPC wire format:
 * - requests: input/body are wrapped as `{ json: <input> }`
 * - responses: `{ result: { data: { json, meta } } }` is unwrapped
 *
 * Hooks must be self-contained arrow functions — they are serialized into the
 * page and run in the browser.
 *
 * @see https://scalar.com/products/api-references/integrations/nextjs
 */
export const GET = ApiReference({
  url: "/openapi.json",
  pageTitle: "ProWater Ops API",
  favicon: "/favicon.ico",
  theme: "default",
  documentDownloadType: "both",
  // Pin the browser renderer so a deploy doesn't silently pick up a new Scalar release.
  bundle: "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.75.1/esm.js",

  onBeforeRequest: ({ requestBuilder }) => {
    // GET queries: tRPC expects `?input={"json":…}`, not `?input={…}`.
    const input = requestBuilder.query.get("input");
    if (input) {
      try {
        requestBuilder.query.set("input", JSON.stringify({ json: JSON.parse(input) }));
      } catch {
        // Leave malformed input untouched and let the server report it.
      }
    }

    // POST mutations: tRPC expects `{"json":…}` as the JSON body.
    const body = requestBuilder.body;
    if (body?.mode === "raw" && typeof body.value === "string" && body.contentType?.includes("json")) {
      try {
        body.value = JSON.stringify({ json: JSON.parse(body.value) });
      } catch {
        // Leave malformed bodies untouched and let the server report them.
      }
    }
  },

  onResponseReceived: async ({ response }) => {
    if (!response.headers.get("content-type")?.includes("application/json")) {
      return;
    }

    try {
      const payload = await response.clone().json();
      if (payload?.result?.data && typeof payload.result.data === "object" && "json" in payload.result.data) {
        payload.result.data = payload.result.data.json;
      }
      if (payload?.error?.json) {
        payload.error = payload.error.json;
      }

      return new Response(JSON.stringify(payload), {
        status: response.status,
        statusText: response.statusText,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Not a tRPC payload — keep the original response.
      return;
    }
  },
});
