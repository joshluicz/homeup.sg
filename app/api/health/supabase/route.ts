import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * GET /api/health/supabase
 * Quick connectivity check — does not expose secrets.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      {
        ok: false,
        step: "env",
        message:
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local (see .env.example).",
      },
      { status: 503 },
    );
  }

  try {
    const supabase = createClient(url, anonKey);
    const { error: listingsError } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true });

    const listingsOk = !listingsError;

    return NextResponse.json({
      ok: listingsOk,
      project_url: url.replace(/https?:\/\//, "").split(".")[0] + ".supabase.co",
      checks: {
        env_url: true,
        env_anon_key: true,
        env_service_role_key: Boolean(serviceKey),
        listings_table: listingsOk
          ? "reachable"
          : listingsError?.message ?? "unknown error",
      },
      hint: listingsOk
        ? "Supabase is connected. Listings table responds to public read."
        : "Env vars are set but the listings query failed — run the migration in supabase/migrations/ or check RLS.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        step: "connect",
        message: err instanceof Error ? err.message : "Connection failed",
      },
      { status: 503 },
    );
  }
}
