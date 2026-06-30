import { NextResponse } from "next/server";
import { getHealth } from "@/lib/propmeta/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getHealth());
  } catch (e) {
    return NextResponse.json({ ok: false, db: "error", error: (e as Error).message }, { status: 503 });
  }
}
