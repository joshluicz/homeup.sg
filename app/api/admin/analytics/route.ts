import { fetchInsights } from "@/lib/analytics/insights";
import type { DatePreset } from "@/lib/analytics/dateRange";
import { requireAuth } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let body: { preset?: DatePreset; startIso?: string; endIso?: string; days?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* no body — use default last30days */
  }

  try {
    const result = await fetchInsights(body);
    if ("error" in result && result.error === "GA4_NOT_CONFIGURED") {
      return NextResponse.json(result, { status: 503 });
    }
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "GA_CONFIG_INVALID") {
      return NextResponse.json(
        { error: "GA_CONFIG_INVALID", detail: "GA_SERVICE_ACCOUNT_JSON is not valid JSON." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "INSIGHTS_ERROR", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
