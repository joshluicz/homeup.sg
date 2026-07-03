import { requireAuth } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { revalidatePlaybookPaths } from "@/lib/playbook/revalidate-playbook";

// On-demand revalidation for the playbook pages. The admin Playbook form writes to
// Supabase directly via the browser client (no server route), so it calls this after a
// save/delete to push new/edited videos + articles live on /playbook and every
// /playbook/[slug] page immediately — instead of waiting out the ISR window
// (revalidate=3600) or needing a redeploy.
export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let slugs: string[] = [];
  try {
    const body = (await request.json()) as { slugs?: string[] };
    if (Array.isArray(body.slugs)) {
      slugs = body.slugs.filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
    }
  } catch {
    slugs = [];
  }

  revalidatePlaybookPaths(slugs);
  return NextResponse.json({ ok: true });
}
