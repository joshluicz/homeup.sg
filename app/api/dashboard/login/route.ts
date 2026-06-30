import { NextResponse } from "next/server";
import { verifyPasscode, sessionCookieHeader } from "@/lib/propmeta/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { passcode } = await req.json().catch(() => ({}));
    const session = await verifyPasscode(String(passcode || ""));
    if (!session) return NextResponse.json({ error: "invalid passcode" }, { status: 401 });
    const res = NextResponse.json({ ok: true, slug: session.slug, role: session.role });
    res.headers.set("Set-Cookie", sessionCookieHeader(session));
    return res;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
