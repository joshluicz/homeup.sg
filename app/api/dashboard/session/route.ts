import { NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/propmeta/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = sessionFromRequest(req);
  return NextResponse.json(s ? { slug: s.slug, role: s.role } : { anon: true });
}
