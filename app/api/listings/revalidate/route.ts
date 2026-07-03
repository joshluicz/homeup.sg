import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { revalidateListingPaths } from "@/lib/listings/revalidate-listings";

export async function POST(request: Request) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  let slugs: string[] = [];
  try {
    const body = (await request.json()) as { slugs?: string[] };
    if (Array.isArray(body.slugs)) {
      slugs = body.slugs.filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
    }
  } catch {
    slugs = [];
  }

  revalidateListingPaths(slugs);
  return NextResponse.json({ success: true });
}
