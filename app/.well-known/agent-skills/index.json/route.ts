import { NextResponse } from "next/server";
import { buildAgentSkillsIndex } from "@/lib/agent-discovery/agent-skills-index";
import { SITE_URL } from "@/lib/seo/constants";

export async function GET() {
  const index = buildAgentSkillsIndex(SITE_URL);
  return NextResponse.json(index, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export const dynamic = "force-dynamic";
