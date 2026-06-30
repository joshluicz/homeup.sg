// PropMeta (dashboard.homeup.sg) → Supabase Postgres, for the analytics dashboard.
// Uses the Supabase TRANSACTION pooler (port 6543) — the serverless-safe one — and caches
// the Pool on globalThis so warm lambda invocations reuse connections instead of exhausting
// the pooler. The analytics SQL (percentile_cont / corr / regr_slope) can't go through
// supabase-js/PostgREST, so we talk raw pg here. Host/user/ref are not secret; the password
// comes from the PROPMETA_DB_PASSWORD env var (set in Vercel → Project → Settings → Env Vars).
import { Pool, types } from "pg";

// numeric (oid 1700) → JS number, so the client doesn't get strings for medians/prices.
types.setTypeParser(1700, (v: string) => (v == null ? (null as unknown as number) : parseFloat(v)));

const g = globalThis as unknown as { __propmetaPool?: Pool };

export const pool =
  g.__propmetaPool ??
  (g.__propmetaPool = new Pool({
    host: process.env.PROPMETA_DB_HOST || "aws-1-ap-southeast-1.pooler.supabase.com",
    port: Number(process.env.PROPMETA_DB_PORT || 6543), // transaction pooler
    user: process.env.PROPMETA_DB_USER || "postgres.mvbgtxinaqgpakbuqabt",
    database: process.env.PROPMETA_DB_DATABASE || "postgres",
    password: process.env.PROPMETA_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: Number(process.env.PROPMETA_DB_MAX || 3),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  }));

// A dropped idle pooler connection emits 'error' on the pool; log instead of crashing.
g.__propmetaPool.on("error", (e: Error) => console.error("[propmeta pg]", e.message));
