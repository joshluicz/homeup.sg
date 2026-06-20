import { NextResponse } from "next/server";
import { buildOAuthProtectedResourceMetadata } from "@/lib/agent-discovery/oauth-protected-resource";

export async function GET() {
  return NextResponse.json(buildOAuthProtectedResourceMetadata(), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
