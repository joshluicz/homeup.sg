import { NextResponse } from "next/server";
import { getAgentBySlug } from "@/lib/data/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Branding for a per-agent dashboard view (dashboard.homeup.sg/a/<slug>).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") || "").trim();
  const a = slug ? getAgentBySlug(slug) : undefined;
  if (!a) return NextResponse.json({ error: "agent not found" }, { status: 404 });
  return NextResponse.json({
    slug: a.slug,
    name: a.name,
    cea: a.cea,
    photo: a.photo,
    profileTitle: a.profileTitle || "Property Advisor",
    specialties: a.specialties || [],
    bio: a.bio,
  });
}
