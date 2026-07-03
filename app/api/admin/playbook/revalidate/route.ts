import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// On-demand revalidation for the playbook pages. The admin Playbook form writes to
// Supabase directly via the browser client (no server route), so it calls this after a
// save/delete to push new/edited videos + articles live on /playbook and every
// /playbook/[slug] page immediately — instead of waiting out the ISR window
// (revalidate=3600) or needing a redeploy.
//
// No auth guard here — revalidation exposes no data and a guard using cookie-based auth
// can silently fail (e.g. expired session) which would block the cache flush entirely.
export async function POST() {
  revalidatePath("/playbook", "page");
  revalidatePath("/playbook/[slug]", "page");
  revalidatePath("/playbook/watch/[slug]", "page");
  revalidatePath("/playbook/topic/[topic]", "page");

  return NextResponse.json({ ok: true });
}
