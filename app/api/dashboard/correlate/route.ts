import { NextResponse } from "next/server";
import { getCorrelate } from "@/lib/propmeta/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    return NextResponse.json(await getCorrelate(Object.fromEntries(searchParams)));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
