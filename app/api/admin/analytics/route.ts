import { fetchGaAnalytics } from "@/lib/ga4/server";
import { requireAuth } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let days = 30;
  try {
    const body = (await request.json()) as { days?: number };
    if (body.days) days = Number(body.days);
  } catch {
    /* no body */
  }

  try {
    const result = await fetchGaAnalytics(days);
    if ("error" in result && result.error === "GA4_NOT_CONFIGURED") {
      return NextResponse.json(result, { status: 503 });
    }
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "GA_CONFIG_INVALID") {
      return NextResponse.json(
        { error: "GA_CONFIG_INVALID", detail: "GA_SERVICE_ACCOUNT_JSON is not valid JSON." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "GA_API_ERROR", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
