import { NextResponse } from "next/server";
import { listClients, createClient } from "@/lib/propmeta/clients";
import { sessionFromRequest } from "@/lib/propmeta/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const s = sessionFromRequest(req);
    if (!s) return NextResponse.json({ error: "login required" }, { status: 401 });
    const requested = new URL(req.url).searchParams.get("agent");
    const agent = s.role === "owner" ? (requested || s.slug) : s.slug;
    return NextResponse.json({ clients: await listClients(agent) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const s = sessionFromRequest(req);
    if (!s) return NextResponse.json({ error: "login required" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    body.agent = s.role === "owner" ? (body.agent || s.slug) : s.slug;
    return NextResponse.json(await createClient(body));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
