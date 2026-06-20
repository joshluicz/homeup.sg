import { NextResponse } from "next/server";
import { buildDnsAidManifest } from "@/lib/agent-discovery/dns-aid-manifest";

export async function GET() {
  return NextResponse.json(buildDnsAidManifest(), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
