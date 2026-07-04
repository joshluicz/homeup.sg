import { NextResponse } from "next/server";
import { createFormToken } from "@/lib/intake/form-token";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { token } = createFormToken();
    return NextResponse.json({ token });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Token unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
