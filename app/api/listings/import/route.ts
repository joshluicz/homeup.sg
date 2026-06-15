import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { runListingImport } from "@/lib/listings/import/run-import";
import type { ImportResponse } from "@/lib/listings/import/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" } satisfies ImportResponse,
      { status: 400 },
    );
  }

  const result = await runListingImport(supabase, body);

  if (!result.success && result.error === "FETCH_BLOCKED") {
    return NextResponse.json(result, { status: 422 });
  }

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
