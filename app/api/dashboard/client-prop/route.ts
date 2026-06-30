import { NextResponse } from "next/server";
import { addProperty, deleteProperty, ownerOfClient, ownerOfProp } from "@/lib/propmeta/clients";
import { sessionFromRequest } from "@/lib/propmeta/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const s = sessionFromRequest(req);
    if (!s) return NextResponse.json({ error: "login required" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const owner = await ownerOfClient(body.clientId);
    if (s.role !== "owner" && owner !== s.slug) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json(await addProperty(body));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const s = sessionFromRequest(req);
    if (!s) return NextResponse.json({ error: "login required" }, { status: 401 });
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const owner = await ownerOfProp(id);
    if (s.role !== "owner" && owner !== s.slug) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json(await deleteProperty(id));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
