import { NextResponse } from "next/server";
import { AGENTS } from "@/lib/data/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Slim agent list for the dashboard's agent switcher.
export async function GET() {
  return NextResponse.json({ agents: AGENTS.map((a) => ({ slug: a.slug, name: a.name })) });
}
