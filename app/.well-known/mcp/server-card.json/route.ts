import { NextResponse } from "next/server";
import { buildMcpServerCard } from "@/lib/agent-discovery/mcp-server-card";

export async function GET() {
  return NextResponse.json(buildMcpServerCard(), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
