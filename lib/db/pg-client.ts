import "server-only";
import postgres from "postgres";

let client: postgres.Sql | null = null;

export function getSql(): postgres.Sql {
  if (!client) {
    const url = process.env.POSTGRES_URL;
    if (!url) {
      throw new Error(
        "Missing POSTGRES_URL env var. Add your Supabase/Postgres connection string."
      );
    }
    client = postgres(url, {
      ssl: "require",
      // Required when connecting through Supabase's pooled (PgBouncer,
      // transaction-mode) connection string — it doesn't support
      // server-side prepared statements.
      prepare: false,
      max: 5,
    });
  }
  return client;
}
