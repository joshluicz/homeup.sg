import { NextResponse } from "next/server";
import { insertFeedback, listFeedback } from "@/lib/propmeta/feedback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Agents submit feature requests from the dashboard; tagged by their slug.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const agentSlug = (String(body.agentSlug || body.agent || "general").trim()) || "general";
    const message = String(body.message || "").trim();
    if (message.length < 2) return NextResponse.json({ error: "message required" }, { status: 400 });
    await insertFeedback(agentSlug, message, String(body.page || ""), req.headers.get("user-agent") || "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// Read submissions (?slug=<agent> or ?slug=all). Unauthenticated for now — Phase 3 adds auth.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    return NextResponse.json({ rows: await listFeedback(searchParams.get("slug") || "all") });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
