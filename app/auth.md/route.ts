import { NextResponse } from "next/server";
import { buildAuthMdDocument } from "@/lib/agent-discovery/auth-md";

export async function GET() {
  const body = buildAuthMdDocument();
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
