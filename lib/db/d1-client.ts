import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

// Memoized per request — the docs advise against a module-level global D1
// client, so this fetches a fresh binding reference each request instead.
export const getDb = cache(async (): Promise<D1Database> => {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) {
    throw new Error("Missing DB binding. Check the d1_databases entry in wrangler.jsonc.");
  }
  return env.DB;
});
