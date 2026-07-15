import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { revalidateListingPaths } from "@/lib/listings/revalidate-listings";

export async function POST(request: Request) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  let slugs: string[] = [];
  let warm = true;
  try {
    const body = (await request.json()) as { slugs?: string[]; warm?: boolean };
    if (Array.isArray(body.slugs)) {
      slugs = body.slugs.filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
    }
    if (typeof body.warm === "boolean") warm = body.warm;
  } catch {
    slugs = [];
  }

  revalidateListingPaths(slugs, { warm });
  return NextResponse.json({ success: true, warmed: warm });
}
