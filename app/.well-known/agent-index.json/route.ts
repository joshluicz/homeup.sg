import { NextResponse } from "next/server";
import { AGENT_INDEX } from "@/lib/agent-discovery/dns-aid";

export async function GET() {
  return NextResponse.json(AGENT_INDEX, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
