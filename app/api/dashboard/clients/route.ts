import { NextResponse } from "next/server";
import { listClients, createClient } from "@/lib/propmeta/clients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const agent = new URL(req.url).searchParams.get("agent");
    if (!agent) return NextResponse.json({ error: "agent required" }, { status: 400 });
    return NextResponse.json({ clients: await listClients(agent) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    return NextResponse.json(await createClient(await req.json().catch(() => ({}))));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
