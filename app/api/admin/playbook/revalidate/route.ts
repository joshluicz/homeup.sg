import { requireAuth } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// On-demand revalidation for the playbook pages. The admin Playbook form writes to
// Supabase directly via the browser client (no server route), so it calls this after a
// save/delete to push new/edited videos + articles live on /playbook and every
// /playbook/[slug] page immediately — instead of waiting out the ISR window
// (revalidate=3600) or needing a redeploy.
export async function POST() {
  const { error } = await requireAuth();
  if (error) return error;

  revalidatePath("/playbook");
  revalidatePath("/playbook/articles");
  revalidatePath("/playbook/videos");
  revalidatePath("/playbook/[slug]", "page");

  return NextResponse.json({ ok: true });
}
